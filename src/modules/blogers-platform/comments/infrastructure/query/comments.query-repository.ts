import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetCommentsQueryParams } from '../../../posts/api/input-dto/get-comments-query-params.input-dto';
import { CoreConfig } from '../../../../../core/core.config';
import { SortDirection } from '../../../../../core/dto/base.query-params.input-dto';

//белый список сортировок: ключи = значения enum CommentsSortBy
const SORT_COLUMNS: Record<string, string> = {
  createdAt: 'c.created_at',
  postId: 'c.post_id',
};

//Колонки комментария + логин автора (JOIN users) + лайки, посчитанные на лету.
//$1 - id текущего пользователя (или NULL для анонима): my_status = его реакция или 'None'.
const SELECT_COMMENT = `
  SELECT c.id, c.content, c.user_id, u.login AS user_login, c.created_at,
    (SELECT COUNT(*) FROM comment_likes l
      WHERE l.comment_id = c.id AND l.status = 'Like') AS likes_count,
    (SELECT COUNT(*) FROM comment_likes l
      WHERE l.comment_id = c.id AND l.status = 'Dislike') AS dislikes_count,
    COALESCE((SELECT l.status FROM comment_likes l
      WHERE l.comment_id = c.id AND l.user_id = $1::uuid), 'None') AS my_status`;
const FROM_COMMENTS = `
  FROM comments c
  JOIN users u ON u.id = c.user_id`;

@Injectable()
export class CommentsQueryRepository {
  constructor(
    private coreConfig: CoreConfig,
    private readonly dataSource: DataSource,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('CommentsQueryRepository created');
  }

  async getById(
    id: string,
    userId: string | null = null,
  ): Promise<CommentViewDto | null> {
    try {
      const rows = await this.dataSource.query(
        `${SELECT_COMMENT}
         ${FROM_COMMENTS}
         WHERE c.id = $2 AND c.deleted_at IS NULL
         LIMIT 1`,
        [userId, id],
      );
      return rows.length ? CommentViewDto.mapRowToView(rows[0]) : null;
    } catch (e) {
      //невалидный uuid -> «не найдено» (аналог CastError в Mongo)
      if ((e as { code?: string })?.code === '22P02') return null;
      throw e;
    }
  }

  async getPostComments(
    query: GetCommentsQueryParams,
    postId: string,
    userId: string | null = null,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const sortColumn = SORT_COLUMNS[query.sortBy] ?? 'c.created_at';
    const sortDirection =
      query.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';

    //COUNT(*) OVER() считает общее количество ПО ФИЛЬТРУ ещё до LIMIT/OFFSET
    const rows = await this.dataSource.query(
      `${SELECT_COMMENT}, COUNT(*) OVER() AS total_count
       ${FROM_COMMENTS}
       WHERE c.post_id = $2 AND c.deleted_at IS NULL
       ORDER BY ${sortColumn} ${sortDirection}, c.id
       LIMIT $3 OFFSET $4`,
      [userId, postId, query.pageSize, query.calculateSkip()],
    );

    //pg возвращает COUNT строкой -> Number()
    let totalCount = rows.length ? Number(rows[0].total_count) : 0;

    //страница за пределами данных: строк нет, значит нет и total_count -> считаем отдельно
    if (!rows.length && query.calculateSkip() > 0) {
      const countRows = await this.dataSource.query(
        `SELECT COUNT(*) AS total_count FROM comments c
         WHERE c.post_id = $1 AND c.deleted_at IS NULL`,
        [postId],
      );
      totalCount = Number(countRows[0].total_count);
    }

    return PaginatedViewDto.mapToView<CommentViewDto[]>({
      items: rows.map((row: any) => CommentViewDto.mapRowToView(row)),
      totalCount,
      page: query.pageNumber,
      pageSize: query.pageSize,
    });
  }
}

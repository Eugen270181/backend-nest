import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { GetPostsQueryParams } from '../../../blogs/api/input-dto/get-posts-query-params.input-dto';
import { CoreConfig } from '../../../../../core/core.config';
import { SortDirection } from '../../../../../core/dto/base.query-params.input-dto';

//белый список сортировок (camelCase -> колонка с алиасом таблицы).
//Ключи = значения enum PostsSortBy. COLLATE "C" - побайтовый порядок как в Mongo.
const SORT_COLUMNS: Record<string, string> = {
  createdAt: 'p.created_at',
  title: 'p.title COLLATE "C"',
  shortDescription: 'p.short_description COLLATE "C"',
  blogName: 'b.name COLLATE "C"',
  updatedAt: 'p.updated_at',
};

//blog_name берём из blogs (в posts его нет);
//INNER JOIN с неудалённым блогом: посты мягко удалённого блога не показываем
//Колонки поста + имя блога + лайки, посчитанные на лету.
//$1 - id текущего пользователя (или NULL для анонима): my_status = его реакция или 'None'.
//newest_likes - 3 последних лайка (json), новые первыми.
const SELECT_POST = `
  SELECT p.*, b.name AS blog_name,
    (SELECT COUNT(*) FROM post_likes l
      WHERE l.post_id = p.id AND l.status = 'Like') AS likes_count,
    (SELECT COUNT(*) FROM post_likes l
      WHERE l.post_id = p.id AND l.status = 'Dislike') AS dislikes_count,
    COALESCE((SELECT l.status FROM post_likes l
      WHERE l.post_id = p.id AND l.user_id = $1::uuid), 'None') AS my_status,
    (SELECT COALESCE(json_agg(json_build_object(
              'addedAt', t.added_at, 'userId', t.user_id, 'login', t.login
            ) ORDER BY t.added_at DESC), '[]'::json)
       FROM (SELECT l.updated_at AS added_at, l.user_id, u.login
               FROM post_likes l
               JOIN users u ON u.id = l.user_id
              WHERE l.post_id = p.id AND l.status = 'Like'
              ORDER BY l.updated_at DESC
              LIMIT 3) t) AS newest_likes`;

const FROM_POSTS = `
  FROM posts p
  JOIN blogs b ON b.id = p.blog_id AND b.deleted_at IS NULL`;

@Injectable()
export class PostsQueryRepository {
  constructor(
    private coreConfig: CoreConfig,
    private readonly dataSource: DataSource,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('PostsQueryRepository created');
  }

  async getById(
    id: string,
    userId: string | null = null,
  ): Promise<PostViewDto | null> {
    try {
      const rows = await this.dataSource.query(
        `${SELECT_POST}
         ${FROM_POSTS}
         WHERE p.id = $2 AND p.deleted_at IS NULL
         LIMIT 1`,
        [userId, id],
      );
      return rows.length ? PostViewDto.mapRowToView(rows[0]) : null;
    } catch (e) {
      //невалидный uuid -> «не найдено» (аналог CastError в Mongo)
      if ((e as { code?: string })?.code === '22P02') return null;
      throw e;
    }
  }

  async getBlogPosts(
    query: GetPostsQueryParams,
    blogId: string,
    userId: string | null = null,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.getPosts(query, blogId, userId);
  }

  async getAll(
    query: GetPostsQueryParams,
    userId: string | null = null,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.getPosts(query, undefined, userId);
  }

  //общий метод: blogId передан -> посты одного блога, иначе все посты
  private async getPosts(
    query: GetPostsQueryParams,
    blogId?: string,
    userId: string | null = null,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const conditions: string[] = ['p.deleted_at IS NULL'];
    const params: unknown[] = [userId]; //$1 всегда userId (нужен для my_status)

    if (blogId) {
      params.push(blogId);
      conditions.push(`p.blog_id = $${params.length}`);
    }
    const where = conditions.join(' AND ');

    const sortColumn = SORT_COLUMNS[query.sortBy] ?? 'p.created_at';
    const sortDirection =
      query.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';

    const filterParamsCount = params.length;
    params.push(query.pageSize, query.calculateSkip());

    //COUNT(*) OVER() считает общее количество ПО ФИЛЬТРУ ещё до LIMIT/OFFSET
    const rows = await this.dataSource.query(
      `${SELECT_POST}, COUNT(*) OVER() AS total_count
       ${FROM_POSTS}
       WHERE ${where}
       ORDER BY ${sortColumn} ${sortDirection}, p.created_at, p.id
       LIMIT $${filterParamsCount + 1} OFFSET $${filterParamsCount + 2}`,
      params,
    );

    //pg возвращает COUNT строкой -> Number()
    let totalCount = rows.length ? Number(rows[0].total_count) : 0;

    //страница за пределами данных: строк нет, значит нет и total_count -> считаем отдельно
    if (!rows.length && query.calculateSkip() > 0) {
      const countRows = await this.dataSource.query(
        `SELECT COUNT(*) AS total_count ${FROM_POSTS}
         WHERE p.deleted_at IS NULL ${blogId ? 'AND p.blog_id = $1' : ''}`,
        blogId ? [blogId] : [],
      );
      totalCount = Number(countRows[0].total_count);
    }

    const items = rows.map((row: any) => PostViewDto.mapRowToView(row));

    return PaginatedViewDto.mapToView<PostViewDto[]>({
      items,
      totalCount,
      page: query.pageNumber,
      pageSize: query.pageSize,
    });
  }
}

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

  async getById(id: string): Promise<PostViewDto | null> {
    try {
      const rows = await this.dataSource.query(
        `SELECT p.*, b.name AS blog_name
         ${FROM_POSTS}
         WHERE p.id = $1 AND p.deleted_at IS NULL
         LIMIT 1`,
        [id],
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
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.getPosts(query, blogId);
  }

  async getAll(
    query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.getPosts(query);
  }

  //общий метод: blogId передан -> посты одного блога, иначе все посты
  private async getPosts(
    query: GetPostsQueryParams,
    blogId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const conditions: string[] = ['p.deleted_at IS NULL'];
    const params: unknown[] = [];

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
      `SELECT p.*, b.name AS blog_name, COUNT(*) OVER() AS total_count
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
        `SELECT COUNT(*) AS total_count ${FROM_POSTS} WHERE ${where}`,
        params.slice(0, filterParamsCount),
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

import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs-query-params.input-dto';
import { CoreConfig } from '../../../../../core/core.config';
import { escapeLike } from '../../../../../core/constants/router-paths';
import { SortDirection } from '../../../../../core/dto/base.query-params.input-dto';

//белый список сортировок: имя колонки НЕЛЬЗЯ передать как параметр $1,
//поэтому подставляем только значения из этого словаря (camelCase -> snake_case).
//Ключи = значения enum BlogsSortBy.
//COLLATE "C" для текстовых колонок = побайтовая сортировка как в Mongo
//(заглавные буквы раньше строчных), иначе Postgres с локалью сортирует без учёта регистра
const SORT_COLUMNS: Record<string, string> = {
  createdAt: 'created_at',
  name: 'name COLLATE "C"',
  description: 'description COLLATE "C"',
  websiteUrl: 'website_url COLLATE "C"',
  isMembership: 'is_membership',
};

@Injectable()
export class BlogsQueryRepository {
  constructor(
    private coreConfig: CoreConfig,
    private readonly dataSource: DataSource,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('BlogsQueryRepository created');
  }

  async getById(id: string): Promise<BlogViewDto | null> {
    try {
      const rows = await this.dataSource.query(
        'SELECT * FROM blogs WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
        [id],
      );
      return rows.length ? BlogViewDto.mapRowToView(rows[0]) : null;
    } catch (e) {
      //невалидный uuid -> «не найдено» (аналог CastError в Mongo)
      if ((e as { code?: string })?.code === '22P02') return null;
      throw e;
    }
  }

  async getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const params: unknown[] = [];

    if (query.searchNameTerm) {
      params.push(`%${escapeLike(query.searchNameTerm)}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }
    const where = conditions.join(' AND ');

    const sortColumn = SORT_COLUMNS[query.sortBy] ?? 'created_at';
    const sortDirection =
      query.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';

    const filterParamsCount = params.length;
    params.push(query.pageSize, query.calculateSkip());

    //COUNT(*) OVER() считает общее количество ПО ФИЛЬТРУ ещё до LIMIT/OFFSET
    const rows = await this.dataSource.query(
      `SELECT *, COUNT(*) OVER() AS total_count
       FROM blogs
       WHERE ${where}
       ORDER BY ${sortColumn} ${sortDirection}, created_at, id
       LIMIT $${filterParamsCount + 1} OFFSET $${filterParamsCount + 2}`,
      params,
    );

    //pg возвращает COUNT строкой -> Number()
    let totalCount = rows.length ? Number(rows[0].total_count) : 0;

    //запросили страницу за пределами данных: строк нет, а значит и total_count нет,
    //поэтому totalCount считаем отдельным запросом
    if (!rows.length && query.calculateSkip() > 0) {
      const countRows = await this.dataSource.query(
        `SELECT COUNT(*) AS total_count FROM blogs WHERE ${where}`,
        params.slice(0, filterParamsCount),
      );
      totalCount = Number(countRows[0].total_count);
    }

    const items = rows.map((row: any) => BlogViewDto.mapRowToView(row));

    return PaginatedViewDto.mapToView<BlogViewDto[]>({
      items,
      totalCount,
      page: query.pageNumber,
      pageSize: query.pageSize,
    });
  }
}

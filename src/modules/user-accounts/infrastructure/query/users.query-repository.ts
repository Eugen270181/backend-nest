import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { CoreConfig } from '../../../../core/core.config';
import { SortDirection } from '../../../../core/dto/base.query-params.input-dto';

//белый список сортировок: имя колонки НЕЛЬЗЯ передать как параметр $1,
//поэтому подставляем только значения из этого словаря (camelCase -> snake_case).
//COLLATE "C" для текстовых колонок = побайтовая сортировка как в Mongo
//(заглавные буквы раньше строчных: 'loSer' < 'log01'), иначе Postgres
//с локалью сортирует без учёта регистра и тесты инкубатора падают
const SORT_COLUMNS: Record<string, string> = {
  createdAt: 'created_at',
  login: 'login COLLATE "C"',
  email: 'email COLLATE "C"',
};

@Injectable()
export class UsersQueryRepository {
  constructor(
    private coreConfig: CoreConfig,
    private readonly dataSource: DataSource,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('UsersQueryRepository created');
  }

  async getById(id: string): Promise<UserViewDto | null> {
    try {
      const rows = await this.dataSource.query(
        'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
        [id],
      );
      return rows.length ? UserViewDto.mapRowToView(rows[0]) : null;
    } catch (e) {
      //невалидный uuid -> «не найдено» (аналог CastError в Mongo)
      if ((e as { code?: string })?.code === '22P02') return null;
      throw e;
    }
  }

  async getAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const params: unknown[] = [];
    const search: string[] = [];

    if (query.searchLoginTerm) {
      params.push(`%${query.searchLoginTerm}%`);
      search.push(`login ILIKE $${params.length}`);
    }
    if (query.searchEmailTerm) {
      params.push(`%${query.searchEmailTerm}%`);
      search.push(`email ILIKE $${params.length}`);
    }
    if (search.length) conditions.push(`(${search.join(' OR ')})`);

    const sortColumn = SORT_COLUMNS[query.sortBy] ?? 'created_at';
    const sortDirection =
      query.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';

    params.push(query.pageSize, query.calculateSkip());

    //один запрос вместо двух: COUNT(*) OVER() считает общее количество
    //ПО ФИЛЬТРУ ещё до LIMIT/OFFSET (замена прежнего Promise.all с countDocuments)
    const rows = await this.dataSource.query(
      `SELECT *, COUNT(*) OVER() AS total_count
       FROM users
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${sortColumn} ${sortDirection}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    //pg возвращает COUNT строкой -> Number()
    const totalCount = rows.length ? Number(rows[0].total_count) : 0;
    const items = rows.map((row: any) => UserViewDto.mapRowToView(row));

    return PaginatedViewDto.mapToView<UserViewDto[]>({
      items,
      totalCount,
      page: query.pageNumber,
      pageSize: query.pageSize,
    });
  }
}

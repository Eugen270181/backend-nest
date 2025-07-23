//dto для запроса списка юзеров с пагинацией, сортировкой, фильтрами
import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';
import { UsersSortBy } from './enum/users-sort-by';

//наследуемся от класса BaseQueryParams, где уже есть pageNumber, pageSize и т.п., чтобы не дублировать эти свойства
export class GetUsersQueryParams extends BaseQueryParams {
  sortBy: UsersSortBy = UsersSortBy.CreatedAt;
  searchLoginTerm: string | null = null;
  searchEmailTerm: string | null = null;
}

//dto для запроса списка юзеров с пагинацией, сортировкой, фильтрами

//наследуемся от класса BaseQueryParams, где уже есть pageNumber, pageSize и т.п., чтобы не дублировать эти свойства
import { BlogsSortBy } from './enum/blogs-sort-by';
import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';

export class GetBlogsQueryParams extends BaseQueryParams {
  sortBy: BlogsSortBy = BlogsSortBy.CreatedAt;
  searchNameTerm: string | null = null;
}

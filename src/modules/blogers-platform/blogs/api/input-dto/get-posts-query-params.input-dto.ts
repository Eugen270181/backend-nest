//dto для запроса списка юзеров с пагинацией, сортировкой, фильтрами

//наследуемся от класса BaseQueryParams, где уже есть pageNumber, pageSize и т.п., чтобы не дублировать эти свойства
import { PostsSortBy } from '../../../posts/api/input-dto/enum/posts-sort-by';
import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { IsEnum } from 'class-validator';

export class GetPostsQueryParams extends BaseQueryParams {
  @IsEnum(PostsSortBy)
  sortBy: PostsSortBy = PostsSortBy.CreatedAt;
}

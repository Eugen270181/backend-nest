import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { CommentsSortBy } from '../../../comments/api/input-dto/enum/comments-sort-by';
import { IsEnum } from 'class-validator';

export class GetCommentsQueryParams extends BaseQueryParams {
  @IsEnum(CommentsSortBy)
  sortBy: CommentsSortBy = CommentsSortBy.CreatedAt;
}

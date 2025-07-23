import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { CommentsSortBy } from '../../../comments/api/input-dto/enum/comments-sort-by';

export class GetCommentsQueryParams extends BaseQueryParams {
  sortBy: CommentsSortBy = CommentsSortBy.CreatedAt;
}

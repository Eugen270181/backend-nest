import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { CommentsQueryRepository } from '../../infrastructure/query/comments.query-repository';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { GetCommentsQueryParams } from '../../../posts/api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetPostDocumentQuery } from '../../../posts/application/queries/get-post-document.query';
import { PostDocument } from '../../../posts/domain/post.entity';
import { CoreConfig } from '../../../../../core/core.config';

export class GetPostCommentsQuery {
  constructor(
    public readonly query: GetCommentsQueryParams,
    public readonly postId: string,
    public readonly userId?: string,
  ) {}
}

@QueryHandler(GetPostCommentsQuery)
export class GetPostCommentsQueryHandler
  implements
    IQueryHandler<GetPostCommentsQuery, PaginatedViewDto<CommentViewDto[]>>
{
  constructor(
    private coreConfig: CoreConfig,
    private commentsQueryRepository: CommentsQueryRepository,
    private queryBus: QueryBus,
  ) {
    if (this.coreConfig.IOC_LOG)
      console.log('GetPostCommentsQueryHandler created');
  }

  async execute({ query, postId, userId }: GetPostCommentsQuery) {
    await this.queryBus.execute<GetPostDocumentQuery, PostDocument>(
      new GetPostDocumentQuery(postId),
    ); // ✅ Добавьте проверку поста

    return this.commentsQueryRepository.getPostComments(
      query,
      postId,
      userId ?? null,
    );
  }
}

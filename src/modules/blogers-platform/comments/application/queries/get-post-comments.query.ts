import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../../core/settings/config';
import { CommentsQueryRepository } from '../../infrastructure/query/comments.query-repository';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { CommentEnrichmentService } from '../services/comment-enrichment.service';
import { GetCommentsQueryParams } from '../../../posts/api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetPostDocumentQuery } from '../../../posts/application/queries/get-post-document.query';
import { PostDocument } from '../../../posts/domain/post.entity';

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
    private commentsQueryRepository: CommentsQueryRepository,
    private commentsEnrichmentService: CommentEnrichmentService,
    private queryBus: QueryBus,
  ) {
    if (appConfig.IOC_LOG) console.log('GetPostCommentsQueryHandler created');
  }

  async execute({ query, postId, userId }: GetPostCommentsQuery) {
    await this.queryBus.execute<GetPostDocumentQuery, PostDocument>(
      new GetPostDocumentQuery(postId),
    ); // ✅ Добавьте проверку поста

    const paginated = await this.commentsQueryRepository.getPostComments(
      query,
      postId,
    );

    if (!userId) return paginated;

    // ✅ Переиспользуем метод параллельно
    paginated.items = await Promise.all(
      paginated.items.map((comment) =>
        this.commentsEnrichmentService.enrich(comment, userId),
      ),
    );

    return paginated;
  }
}

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../../core/settings/config';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CommentsQueryRepository } from '../../infrastructure/query/comments.query-repository';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { CommentEnrichmentService } from '../services/comment-enrichment.service';

export class GetCommentQuery {
  constructor(
    public readonly commentId: string,
    public readonly userId?: string,
    public readonly justCreated: boolean = false,
  ) {}
}

@QueryHandler(GetCommentQuery)
export class GetCommentQueryHandler
  implements IQueryHandler<GetCommentQuery, CommentViewDto>
{
  constructor(
    private commentsQueryRepository: CommentsQueryRepository,
    private commentsEnrichmentService: CommentEnrichmentService,
  ) {
    if (appConfig.IOC_LOG) console.log('GetPostQueryHandler created');
  }

  async execute({ commentId, userId, justCreated }: GetCommentQuery) {
    const commentViewDto =
      await this.commentsQueryRepository.getById(commentId);

    if (!commentViewDto) {
      if (!justCreated) {
        throw new DomainException({
          code: DomainExceptionCode.NotFound,
          message: `Comment with id:${commentId} - Not found`,
        });
      } else {
        throw new Error(
          `Just Created Comment with id:${commentId} - Not found`,
        );
      }
    }

    return this.commentsEnrichmentService.enrich(commentViewDto, userId);
  }
}

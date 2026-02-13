import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { CommentDocument } from '../../domain/comment.entity';

export class GetCommentDocumentQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetCommentDocumentQuery)
export class GetCommentDocumentQueryHandler
  implements IQueryHandler<GetCommentDocumentQuery, CommentDocument>
{
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async execute({ id }: GetCommentDocumentQuery): Promise<CommentDocument> {
    const commentDocument = await this.commentsRepository.findById(id);

    if (!commentDocument) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `Comment not found: ${id}`,
      });
    }

    return commentDocument;
  }
}

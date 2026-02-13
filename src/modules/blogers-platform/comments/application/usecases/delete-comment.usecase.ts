import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CommentDocument } from '../../domain/comment.entity';
import { GetCommentDocumentQuery } from '../queries/get-comment-document.query';

export class DeleteCommentCommand {
  constructor(
    public readonly commentId: string,
    public readonly userId: string,
  ) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase
  implements ICommandHandler<DeleteCommentCommand>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commentsRepository: CommentsRepository,
  ) {}

  async execute({ commentId, userId }: DeleteCommentCommand) {
    const commentDocument = await this.queryBus.execute<
      GetCommentDocumentQuery,
      CommentDocument
    >(new GetCommentDocumentQuery(commentId)); //404

    if (commentDocument.commentatorInfo.userId !== userId) {
      //403
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: `Actions with comment - ${commentId} denied for user - ${userId}`,
      });
    }

    commentDocument.makeDeleted();

    await this.commentsRepository.save(commentDocument);
  }
}

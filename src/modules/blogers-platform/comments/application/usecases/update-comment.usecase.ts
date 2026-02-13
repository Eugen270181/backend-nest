import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UpdateCommentDto } from '../dto/comment.dto';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { GetCommentDocumentQuery } from '../queries/get-comment-document.query';
import { CommentDocument } from '../../domain/comment.entity';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UpdateCommentDomainDto } from '../../domain/dto/update-comment.domain.dto';

export class UpdateCommentCommand {
  constructor(public readonly dto: UpdateCommentDto) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commentsRepository: CommentsRepository,
  ) {}

  async execute({ dto }: UpdateCommentCommand) {
    const commentDocument = await this.queryBus.execute<
      GetCommentDocumentQuery,
      CommentDocument
    >(new GetCommentDocumentQuery(dto.commentId)); //404

    if (commentDocument.commentatorInfo.userId !== dto.userId) {
      //403
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: `Actions with comment - ${dto.commentId} denied for user - ${dto.userId}`,
      });
    }

    const updateCommentDomainDto: UpdateCommentDomainDto = {
      content: dto.content,
    };
    commentDocument.update(updateCommentDomainDto);

    await this.commentsRepository.save(commentDocument);
  }
}

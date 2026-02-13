import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';

import { GetCommentDocumentQuery } from '../queries/get-comment-document.query';
import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';
import { LikeCommentDto } from '../../../likes/application/dto/like-comment.dto';
import { CommentDocument } from '../../domain/comment.entity';
import { UpdateLikeCommentCommand } from '../../../likes/application/usecases/update-like-comment.usecase';

export class UpdateCommentLikeCommand {
  constructor(public readonly dto: LikeCommentDto) {}
}

@CommandHandler(UpdateCommentLikeCommand)
export class UpdateCommentLikeUseCase
  implements ICommandHandler<UpdateCommentLikeCommand>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  async execute({ dto }: UpdateCommentLikeCommand) {
    // 1. ✅ Проверка наличия коммента, лайк которого собираемся обновлять
    const commentDocument = await this.queryBus.execute<
      GetCommentDocumentQuery,
      CommentDocument
    >(new GetCommentDocumentQuery(dto.commentId));

    // 2. ✅ Делегируем создание/обновление лайка коммента
    const oldStatus = await this.commandBus.execute<
      UpdateLikeCommentCommand,
      LikeStatus | null
    >(new UpdateLikeCommentCommand(dto));
    if (!oldStatus) return; //если обновление лайка/дизлайка поста не произошло

    // 3. ✅ Сами обновляем счетчики лайков/дизлайков в комменте
    await this.updateLikeCounters(oldStatus, dto.likeStatus, commentDocument);
  }

  private async updateLikeCounters(
    oldLikeStatus: LikeStatus,
    newLikeStatus: LikeStatus,
    commentDocument: CommentDocument,
  ) {
    if (oldLikeStatus === LikeStatus.None) {
      if (newLikeStatus === LikeStatus.Like) {
        commentDocument.incrementLikes();
      } else if (newLikeStatus === LikeStatus.Dislike) {
        commentDocument.incrementDislikes();
      }
    }

    if (oldLikeStatus === LikeStatus.Like) {
      commentDocument.decrementLikes();
      if (newLikeStatus === LikeStatus.Dislike) {
        commentDocument.incrementDislikes();
      }
    }

    if (oldLikeStatus === LikeStatus.Dislike) {
      commentDocument.decrementDislikes();
      if (newLikeStatus === LikeStatus.Like) {
        commentDocument.incrementLikes();
      }
    }

    await commentDocument.save();
  }
}

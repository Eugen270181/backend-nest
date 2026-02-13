import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';

import { PostDocument } from '../../domain/post.entity';
import { GetPostDocumentQuery } from '../queries/get-post-document.query';
import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';
import { LikePostDto } from '../../../likes/application/dto/like-post.dto';
import { UpdateLikePostCommand } from '../../../likes/application/usecases/update-like-post.usecase';

export class UpdatePostLikeCommand {
  constructor(public readonly dto: LikePostDto) {}
}

@CommandHandler(UpdatePostLikeCommand)
export class UpdatePostLikeUseCase
  implements ICommandHandler<UpdatePostLikeCommand>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}
  //todo with  service and sub-queries
  async execute({ dto }: UpdatePostLikeCommand) {
    // 1. ✅ Проверка наличия поста, лайк которого собираемся обновлять
    const postDocument = await this.queryBus.execute<
      GetPostDocumentQuery,
      PostDocument
    >(new GetPostDocumentQuery(dto.postId));

    // 2. ✅ Делегируем создание/обновление лайка поста
    const oldStatus = await this.commandBus.execute<
      UpdateLikePostCommand,
      LikeStatus | null
    >(new UpdateLikePostCommand(dto));
    if (!oldStatus) return; //если обновление лайка/дизлайка поста не произошло

    // 3. ✅ Сами обновляем счетчики лайков/дизлайков в посте
    await this.updateLikeCounters(oldStatus, dto.likeStatus, postDocument);
  }

  private async updateLikeCounters(
    oldLikeStatus: LikeStatus,
    newLikeStatus: LikeStatus,
    postDocument: PostDocument,
  ) {
    if (oldLikeStatus === LikeStatus.None) {
      if (newLikeStatus === LikeStatus.Like) {
        postDocument.incrementLikes();
      } else if (newLikeStatus === LikeStatus.Dislike) {
        postDocument.incrementDislikes();
      }
    }

    if (oldLikeStatus === LikeStatus.Like) {
      postDocument.decrementLikes();
      if (newLikeStatus === LikeStatus.Dislike) {
        postDocument.incrementDislikes();
      }
    }

    if (oldLikeStatus === LikeStatus.Dislike) {
      postDocument.decrementDislikes();
      if (newLikeStatus === LikeStatus.Like) {
        postDocument.incrementLikes();
      }
    }

    await postDocument.save();
  }
}

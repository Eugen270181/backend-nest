import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { GetCommentDocumentQuery } from '../queries/get-comment-document.query';
import { LikeCommentDto } from '../../../likes/application/dto/like-comment.dto';
import { CommentDocument } from '../../domain/comment.entity';
import { LikesCommentsRepository } from '../../../likes/infrastructure/likes-comments.repository';

export class UpdateCommentLikeCommand {
  constructor(public readonly dto: LikeCommentDto) {}
}

@CommandHandler(UpdateCommentLikeCommand)
export class UpdateCommentLikeUseCase
  implements ICommandHandler<UpdateCommentLikeCommand>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly likesCommentsRepository: LikesCommentsRepository,
  ) {}

  async execute({ dto }: UpdateCommentLikeCommand) {
    // 1. Проверка наличия коммента, лайк которого собираемся обновлять (404)
    await this.queryBus.execute<GetCommentDocumentQuery, CommentDocument>(
      new GetCommentDocumentQuery(dto.commentId),
    );

    // 2. Выставляем реакцию (UPSERT / DELETE для None). Счётчики не храним -
    // likesCount/dislikesCount считаются из comment_likes при чтении.
    await this.likesCommentsRepository.setStatus(
      dto.commentId,
      dto.authorId,
      dto.likeStatus,
    );
  }
}

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';
import { LikeCommentDto } from '../dto/like-comment.dto';
import { LikesCommentsRepository } from '../../infrastructure/likes-comments.repository';
import {
  LikeComment,
  LikeCommentModelType,
} from '../../domain/like-comment.entity';

export class UpdateLikeCommentCommand {
  constructor(public readonly dto: LikeCommentDto) {}
}

@CommandHandler(UpdateLikeCommentCommand)
export class UpdateLikeCommentUseCase
  implements ICommandHandler<UpdateLikeCommentCommand, LikeStatus | null>
{
  constructor(
    @InjectModel(LikeComment.name)
    private readonly LikeCommentModel: LikeCommentModelType,
    private likesCommentsRepository: LikesCommentsRepository,
  ) {}

  async execute({ dto }: UpdateLikeCommentCommand): Promise<LikeStatus | null> {
    const likeCommentDocument =
      await this.likesCommentsRepository.findLikeCommentByAuthorIdAndCommentId(
        dto.authorId,
        dto.commentId,
      );

    const oldStatus = likeCommentDocument?.likeStatus ?? LikeStatus.None;
    if (dto.likeStatus === oldStatus) return null;

    if (likeCommentDocument) {
      likeCommentDocument.update(dto.likeStatus);
      await likeCommentDocument.save();
    } else {
      const newLikeCommentDocument =
        this.LikeCommentModel.createLikeComment(dto);
      await this.likesCommentsRepository.save(newLikeCommentDocument);
    }

    return oldStatus; // Возвращаем старый статус лайка
  }
}

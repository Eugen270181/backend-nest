import { InjectModel } from '@nestjs/mongoose';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LikeComment,
  LikeCommentDocument,
  LikeCommentModelType,
} from '../domain/like-comment.entity';
import { UsersRepository } from '../../../user-accounts/infrastructure/users.repository';
import { CommentsRepository } from '../../comments/infrastructure/comments.repository';
import { LikeCommentInputDto } from '../../comments/api/input-dto/like-comment.input-dto';
import { LikeStatus } from '../../../../core/dto/enum/like-status.enum';
import { LikesCommentsRepository } from '../infrastructure/likes-comments.repository';
import { LikeCommentDto } from './dto/like-comment.dto';

@Injectable()
export class LikesCommentsService {
  constructor(
    @InjectModel(LikeComment.name)
    private readonly LikeCommentModel: LikeCommentModelType,
    private usersRepository: UsersRepository,
    private commentsRepository: CommentsRepository,
    private likesCommentsRepository: LikesCommentsRepository,
  ) {}

  async updateLike(dto: LikeCommentDto): Promise<LikeStatus | null> {
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

    return oldStatus; // ✅ Возвращаем для CommentsService
  }
}

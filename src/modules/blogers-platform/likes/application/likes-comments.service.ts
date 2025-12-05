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
  async updateCommentLike(
    likeInput: LikeCommentInputDto,
    commentId: string,
    userId: string,
  ) {
    const newLikeCommentStatus = likeInput.likeStatus;
    if (!(newLikeCommentStatus in LikeStatus)) {
      throw new BadRequestException();
    }

    const foundCommentDocument =
      await this.commentsRepository.findById(commentId);
    if (!foundCommentDocument) {
      throw new NotFoundException();
    }

    //logic found and update or create new likeCommentDocument
    const foundLikeCommentDocument =
      await this.likesCommentsRepository.findLikeCommentByAuthorIdAndCommentId(
        userId,
        commentId,
      );
    let oldLikeCommentStatus: LikeStatus = LikeStatus.None;

    if (foundLikeCommentDocument) {
      oldLikeCommentStatus = foundLikeCommentDocument.likeStatus;
      foundLikeCommentDocument.update(newLikeCommentStatus);
      foundLikeCommentDocument.save();
    } else {
      //создание документа лайка комментария
      const likeCommentDto: LikeCommentDto = {
        authorId: userId,
        commentId: commentId,
        likeStatus: newLikeCommentStatus,
      };
      const newLikeCommentDocument: LikeCommentDocument =
        await this.LikeCommentModel.create(likeCommentDto);
      await this.likesCommentsRepository.save(newLikeCommentDocument);
    }
    //update or no LikeComment/Dislike counters foundCommentDocument
    await this.updateCommentLikeCounters(
      oldLikeCommentStatus,
      newLikeCommentStatus,
      commentId,
    );
    //console.log(`updateCommentLike:${userId}:${commentId}:${oldLikeStatus}:${newLikeStatus}`)

    return;
  }

  private async updateCommentLikeCounters(
    oldLikeStatus: LikeStatus,
    newLikeStatus: LikeStatus,
    commentId: string,
  ) {
    if (oldLikeStatus === newLikeStatus) return false; //если ошибочно фронт прислал тотже статус лайка

    if (oldLikeStatus === LikeStatus.None) {
      if (newLikeStatus === LikeStatus.Like) {
        await this.commentsRepository.increaseLikeCounter(commentId);
      } else {
        await this.commentsRepository.increaseDislikeCounter(commentId);
      }
    }

    if (oldLikeStatus === LikeStatus.Like) {
      await this.commentsRepository.decreaseLikeCounter(commentId);
      if (newLikeStatus === LikeStatus.Dislike) {
        await this.commentsRepository.increaseDislikeCounter(commentId);
      }
    }

    if (oldLikeStatus === LikeStatus.Dislike) {
      await this.commentsRepository.decreaseDislikeCounter(commentId);
      if (newLikeStatus === LikeStatus.Like) {
        await this.commentsRepository.increaseLikeCounter(commentId);
      }
    }

    return true;
  }
}

import { Injectable } from '@nestjs/common';
import { CommentsRepository } from '../infrastructure/comments.repository';
import { appConfig } from '../../../../core/settings/config';

import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';

import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { CreateCommentDomainDto } from '../domain/dto/create-comment.domain.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/comment.entity';
import { UsersRepository } from '../../../user-accounts/infrastructure/users.repository';
import { UpdatePostDomainDto } from '../../posts/domain/dto/update-post.domain.dto';
import { UpdateCommentDomainDto } from '../domain/dto/update-comment.domain.dto';
import { LikeStatus } from '../../../../core/dto/enum/like-status.enum';
import { LikesCommentsService } from '../../likes/application/likes-comments.service';
import { LikeCommentDto } from '../../likes/application/dto/like-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name)
    private readonly CommentModel: CommentModelType,
    private readonly commentsRepository: CommentsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly likesCommentsService: LikesCommentsService,
  ) {
    if (appConfig.IOC_LOG) console.log('CommentsService created');
  }
  //TODO delete by Id, put by Id, put like-status by Id...
  private async checkPostOrFail(id: string) {
    const postDocument = await this.postsRepository.findById(id);

    if (!postDocument) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `Post not found: ${id}`,
      });
    }
    //return postDocument;
  }
  private async getCommentOrFail(id: string) {
    const commentDocument = await this.commentsRepository.findById(id);

    if (!commentDocument) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `Comment not found: ${id}`,
      });
    }

    return commentDocument;
  }

  private async updateLikeCounters(
    oldLikeStatus: LikeStatus,
    newLikeStatus: LikeStatus,
    commentId: string,
  ) {
    const commentDocument = await this.commentsRepository.findById(commentId);
    if (!commentDocument) return;
    if (oldLikeStatus === newLikeStatus) return;

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

  async createComment(dto: CreateCommentDto): Promise<string> {
    await this.checkPostOrFail(dto.postId);

    const userDocument = await this.usersRepository.findById(dto.userId);
    const userLogin = userDocument!.login;
    const createCommentDomainDto = { ...dto, userLogin };
    const commentDocument: CommentDocument = this.CommentModel.createComment(
      createCommentDomainDto,
    );

    await this.commentsRepository.save(commentDocument);

    return commentDocument._id.toString();
  }

  async updateComment(dto: UpdateCommentDto) {
    const commentDocument = await this.getCommentOrFail(dto.commentId); //404

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

  async updateLike(dto: LikeCommentDto): Promise<void> {
    // 1. Проверка комментария
    const commentDocument = await this.commentsRepository.findById(
      dto.commentId,
    );
    if (!commentDocument) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }

    // 2. ✅ Делегируем создание/обновление лайка
    const oldStatus = await this.likesCommentsService.updateLike(dto);
    if (!oldStatus) return; //если обновление не произошло

    // 3. ✅ Сами обновляем счетчики
    await this.updateLikeCounters(oldStatus, dto.likeStatus, dto.commentId);
  }

  async deleteComment(id: string, userId: string) {
    const commentDocument = await this.getCommentOrFail(id); //404

    if (commentDocument.commentatorInfo.userId !== userId) {
      //403
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: `Actions with comment - ${id} denied for user - ${userId}`,
      });
    }

    commentDocument.makeDeleted();

    await this.commentsRepository.save(commentDocument);
  }
}

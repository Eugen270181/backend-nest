import { InjectModel } from '@nestjs/mongoose';
import {
  LikeComment,
  LikeCommentDocument,
  LikeCommentModelType,
} from '../domain/like-comment.entity';
import { Injectable } from '@nestjs/common';
import { appConfig } from '../../../../core/settings/config';

@Injectable()
export class LikesCommentsRepository {
  constructor(
    @InjectModel(LikeComment.name)
    private readonly LikeCommentModel: LikeCommentModelType,
  ) {
    if (appConfig.IOC_LOG) console.log('LikesCommentsRepository created');
  }

  async save(likeCommentDocument: LikeCommentDocument): Promise<void> {
    await likeCommentDocument.save();
  }
  async findLikeCommentByAuthorIdAndCommentId(
    authorId: string,
    commentId: string,
  ): Promise<LikeCommentDocument | null> {
    return this.LikeCommentModel.findOne({ authorId, commentId });
  }
}

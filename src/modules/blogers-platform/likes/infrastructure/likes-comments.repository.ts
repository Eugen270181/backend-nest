import { InjectModel } from '@nestjs/mongoose';
import {
  LikeComment,
  LikeCommentDocument,
  LikeCommentModelType,
} from '../domain/like-comment.entity';
import { Injectable } from '@nestjs/common';
import { CoreConfig } from '../../../../core/core.config';

@Injectable()
export class LikesCommentsRepository {
  constructor(
    private coreConfig: CoreConfig,
    @InjectModel(LikeComment.name)
    private readonly LikeCommentModel: LikeCommentModelType,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('LikesCommentsRepository created');
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

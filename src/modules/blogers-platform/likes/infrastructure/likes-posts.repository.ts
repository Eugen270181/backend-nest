import { InjectModel } from '@nestjs/mongoose';

import { Injectable } from '@nestjs/common';
import {
  LikePost,
  LikePostDocument,
  LikePostModelType,
} from '../domain/like-post.entity';
import { LikeStatus } from '../../../../core/dto/enum/like-status.enum';
import { CoreConfig } from '../../../../core/core.config';

@Injectable()
export class LikesPostsRepository {
  constructor(
    private coreConfig: CoreConfig,
    @InjectModel(LikePost.name)
    private readonly LikePostModel: LikePostModelType,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('LikesPostsRepository created');
  }

  async save(likePostDocument: LikePostDocument): Promise<void> {
    await likePostDocument.save();
  }

  async findLikePostByAuthorIdAndPostId(
    authorId: string,
    postId: string,
  ): Promise<LikePostDocument | null> {
    return this.LikePostModel.findOne({ authorId, postId });
  }

  async getNewestLikes(
    postId: string,
    limit: number = 3,
  ): Promise<LikePostDocument[]> {
    return this.LikePostModel.find({
      postId,
      likeStatus: LikeStatus.Like, // ✅ Только лайки
      deletedAt: null,
    })
      .sort({ createdAt: -1 }) // ✅ Новые первыми
      .limit(limit)
      .lean();
  }
}

import { InjectModel } from '@nestjs/mongoose';

import { Injectable } from '@nestjs/common';
import { appConfig } from '../../../../core/settings/config';
import {
  LikePost,
  LikePostDocument,
  LikePostModelType,
} from '../domain/like-post.entity';

@Injectable()
export class LikesPostsRepository {
  constructor(
    @InjectModel(LikePost.name)
    private readonly LikePostModel: LikePostModelType,
  ) {
    if (appConfig.IOC_LOG) console.log('LikesPostsRepository created');
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
}

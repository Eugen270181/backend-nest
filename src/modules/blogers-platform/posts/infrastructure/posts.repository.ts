import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import { appConfig } from '../../../../core/settings/config';

@Injectable()
export class PostsRepository {
  //инжектирование модели через DI
  constructor(
    @InjectModel(Post.name) private readonly PostModel: PostModelType,
  ) {
    if (appConfig.IOC_LOG) console.log('PostsRepository created');
  }

  async findById(id: string): Promise<PostDocument | null> {
    return this.PostModel.findOne({
      _id: id,
      deletedAt: null,
    }).catch(() => null);
  }

  async save(postDocument: PostDocument) {
    await postDocument.save();
  }
}

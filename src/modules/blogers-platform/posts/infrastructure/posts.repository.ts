import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import { CoreConfig } from '../../../../core/core.config';
import { Error as MongooseError } from 'mongoose';

@Injectable()
export class PostsRepository {
  //инжектирование модели через DI
  constructor(
    private coreConfig: CoreConfig,
    @InjectModel(Post.name) private readonly PostModel: PostModelType,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('PostsRepository created');
  }

  async findById(id: string): Promise<PostDocument | null> {
    try {
      return this.PostModel.findOne({
        _id: id,
        deletedAt: null,
      });
    } catch (e) {
      if (e instanceof MongooseError.CastError) return null; // невалидный id → «не найдено»
      throw e; // обрыв коннекта и пр. → 500
    }
  }

  async save(postDocument: PostDocument) {
    await postDocument.save();
  }
}

import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';

@Injectable()
export class PostsRepository {
  //инжектирование модели через DI
  constructor(
    @InjectModel(Post.name) private readonly PostModel: PostModelType,
  ) {
    console.log('PostsRepository created');
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

  async findOrNotFoundFail(id: string): Promise<PostDocument> {
    const postDocument = await this.findById(id);

    if (!postDocument) {
      //TODO: replace with domain exception
      throw new NotFoundException('post not found');
    }

    return postDocument;
  }
}

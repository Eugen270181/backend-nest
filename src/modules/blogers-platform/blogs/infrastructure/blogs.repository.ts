import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';

@Injectable()
export class BlogsRepository {
  //инжектирование модели через DI
  constructor(
    @InjectModel(Blog.name) private readonly BlogModel: BlogModelType,
  ) {
    console.log('BlogsRepository created');
  }

  async findById(id: string): Promise<BlogDocument | null> {
    return this.BlogModel.findOne({
      _id: id,
      deletedAt: null,
    }).catch(() => null);
  }

  async save(blog: BlogDocument) {
    await blog.save();
  }

  async findOrNotFoundFail(id: string): Promise<BlogDocument> {
    const blog = await this.findById(id);

    if (!blog) {
      //TODO: replace with domain exception
      throw new NotFoundException('blog not found');
    }

    return blog;
  }
}

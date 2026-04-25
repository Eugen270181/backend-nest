import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';
import { CoreConfig } from '../../../../core/core.config';

@Injectable()
export class BlogsRepository {
  //инжектирование модели через DI
  constructor(
    private coreConfig: CoreConfig,
    @InjectModel(Blog.name) private readonly BlogModel: BlogModelType,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('BlogsRepository created');
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
}

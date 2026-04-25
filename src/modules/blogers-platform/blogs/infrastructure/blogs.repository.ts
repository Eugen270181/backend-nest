import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Error as MongooseError } from 'mongoose';
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
    try {
      return this.BlogModel.findOne({
        _id: id,
        deletedAt: null,
      });
    } catch (e) {
      if (e instanceof MongooseError.CastError) return null; // невалидный id → «не найдено»
      throw e; // обрыв коннекта и пр. → 500
    }
  }

  async save(blog: BlogDocument) {
    await blog.save();
  }
}

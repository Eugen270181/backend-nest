import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreateBlogDomainDto } from './dto/create-blog.domain.dto';
import { HydratedDocument, Model } from 'mongoose';
import { UpdateBlogDomainDto } from './dto/update-blog.domain.dto';

@Schema({ timestamps: true })
export class Blog {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, required: true })
  websiteUrl: string;

  @Prop({ type: Boolean, required: true, default: false })
  isMembership: boolean;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;

  static createBlog(dto: CreateBlogDomainDto): BlogDocument {
    const blog = new this();

    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;

    return blog as BlogDocument;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Blog Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  update(dto: UpdateBlogDomainDto) {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

//регистрирует методы сущности в схеме
BlogSchema.loadClass(Blog);

//Типизация документа
export type BlogDocument = HydratedDocument<Blog>;

//Типизация модели + статические методы
export type BlogModelType = Model<BlogDocument> & typeof Blog;

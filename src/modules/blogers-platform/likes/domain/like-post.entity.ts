import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeStatus } from '../../../../core/dto/enum/like-status.enum';
import { HydratedDocument, Model } from 'mongoose';
import { LikePostDomainDto } from './dto/like-post.domain.dto';

@Schema({ timestamps: true })
export class LikePost {
  @Prop({ type: String, required: true })
  authorId: string;

  @Prop({ type: String, required: true })
  postId: string;

  @Prop({ type: String, enum: LikeStatus, required: true }) // Добавьте type и enum
  likeStatus: LikeStatus;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;

  static create(dto: LikePostDomainDto): LikePostDocument {
    const likePostDocument = new this();

    likePostDocument.authorId = dto.authorId;
    likePostDocument.postId = dto.postId;
    likePostDocument.likeStatus = dto.likeStatus;

    return likePostDocument as LikePostDocument;
  }

  update(newStatus: LikeStatus) {
    this.likeStatus = newStatus;
  }
}

export const LikePostSchema = SchemaFactory.createForClass(LikePost);

//регистрирует методы сущности в схеме
LikePostSchema.loadClass(LikePost);

//Типизация документа
export type LikePostDocument = HydratedDocument<LikePost>;

//Типизация модели + статические методы
export type LikePostModelType = Model<LikePostDocument> & typeof LikePost;

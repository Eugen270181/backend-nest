import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeStatus } from '../../../../core/dto/enum/like-status.enum';
import { HydratedDocument, Model } from 'mongoose';
import { LikePostDomainDto } from './dto/like-post.domain.dto';

@Schema({ timestamps: true })
export class LikePost {
  @Prop({ type: String, required: true })
  authorId: string;

  @Prop({ type: String, required: true })
  authorLogin: string;

  @Prop({ type: String, required: true })
  postId: string;

  @Prop({ type: String, enum: LikeStatus, required: true }) // Добавьте type и enum
  likeStatus: LikeStatus;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;

  static createLikePost(dto: LikePostDomainDto): LikePostDocument {
    const likePostDocument = new this();

    likePostDocument.authorId = dto.authorId;
    likePostDocument.authorLogin = dto.authorLogin;
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
// ✅ Индексы для быстрой выборки
LikePostSchema.index({ postId: 1, likeStatus: 1, createdAt: -1 }); // Для newestLikes
LikePostSchema.index({ authorId: 1, postId: 1 }); // Для поиска лайка юзера

//Типизация документа
export type LikePostDocument = HydratedDocument<LikePost>;

//Типизация модели + статические методы
export type LikePostModelType = Model<LikePostDocument> & typeof LikePost;

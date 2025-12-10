import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeStatus } from '../../../../core/dto/enum/like-status.enum';
import { HydratedDocument, Model } from 'mongoose';
import { LikeCommentDomainDto } from './dto/like-comment.domain.dto';

@Schema({ timestamps: true })
export class LikeComment {
  @Prop({ type: String, required: true })
  authorId: string;

  @Prop({ type: String, required: true })
  commentId: string;

  @Prop({ type: String, enum: LikeStatus, required: true }) // Добавьте type и enum
  likeStatus: LikeStatus;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;

  static createLikeComment(dto: LikeCommentDomainDto): LikeCommentDocument {
    const likeCommentDocument = new this();

    likeCommentDocument.authorId = dto.authorId;
    likeCommentDocument.commentId = dto.commentId;
    likeCommentDocument.likeStatus = dto.likeStatus;

    return likeCommentDocument as LikeCommentDocument;
  }

  update(newStatus: LikeStatus) {
    this.likeStatus = newStatus;
  }
}

export const LikeCommentSchema = SchemaFactory.createForClass(LikeComment);

//регистрирует методы сущности в схеме
LikeCommentSchema.loadClass(LikeComment);

//Типизация документа
export type LikeCommentDocument = HydratedDocument<LikeComment>;

//Типизация модели + статические методы
export type LikeCommentModelType = Model<LikeCommentDocument> &
  typeof LikeComment;

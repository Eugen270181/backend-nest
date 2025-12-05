import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import {
  CommentatorInfo,
  CommentatorInfoSchema,
} from './commentator-info.schema';
import { CreateCommentDomainDto } from './dto/create-comment.domain.dto';
import { UpdateCommentDomainDto } from './dto/update-comment.domain.dto';

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  postId: string;

  @Prop({ type: CommentatorInfoSchema, required: true })
  commentatorInfo: CommentatorInfo;

  @Prop({ type: Number, required: true, default: 0 })
  likesCount: number;

  @Prop({ type: Number, required: true, default: 0 })
  dislikesCount: number;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;

  static createComment(dto: CreateCommentDomainDto): CommentDocument {
    const commentDocument = new this();

    commentDocument.content = dto.content;
    commentDocument.postId = dto.postId;
    commentDocument.commentatorInfo = {
      userId: dto.userId,
      userLogin: dto.userLogin,
    };

    return commentDocument as CommentDocument;
  }

  update(dto: UpdateCommentDomainDto) {
    this.content = dto.content;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Blog Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  incrementLikes() {
    this.likesCount++;
  }

  decrementLikes() {
    if (this.likesCount > 0) this.likesCount--;
  }

  incrementDislikes() {
    this.dislikesCount++;
  }

  decrementDislikes() {
    if (this.dislikesCount > 0) this.dislikesCount--;
  }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

//регистрирует методы сущности в схеме
CommentSchema.loadClass(Comment);

//Типизация документа
export type CommentDocument = HydratedDocument<Comment>;

//Типизация модели + статические методы
export type CommentModelType = Model<CommentDocument> & typeof Comment;

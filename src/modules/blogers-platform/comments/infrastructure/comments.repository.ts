import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/comment.entity';

@Injectable()
export class CommentsRepository {
  //инжектирование модели через DI
  constructor(
    @InjectModel(Comment.name) private readonly CommentModel: CommentModelType,
  ) {
    console.log('CommentsRepository created');
  }

  async findById(id: string): Promise<CommentDocument | null> {
    return this.CommentModel.findOne({
      _id: id,
      deletedAt: null,
    }).catch(() => null);
  }

  async save(commentDocument: CommentDocument) {
    await commentDocument.save();
  }

  async findOrNotFoundFail(id: string): Promise<CommentDocument> {
    const commentDocument = await this.findById(id);

    if (!commentDocument) {
      //TODO: replace with domain exception
      throw new NotFoundException('comment not found');
    }

    return commentDocument;
  }
}

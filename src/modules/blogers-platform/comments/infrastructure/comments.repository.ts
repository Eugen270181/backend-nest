import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/comment.entity';
import { appConfig } from '../../../../core/settings/config';

@Injectable()
export class CommentsRepository {
  //инжектирование модели через DI
  constructor(
    @InjectModel(Comment.name) private readonly CommentModel: CommentModelType,
  ) {
    if (appConfig.IOC_LOG) console.log('CommentsRepository created');
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

  async increaseLikeCounter(_id: string) {
    await this.CommentModel.updateOne(
      { _id, deletedAt: null },
      { $inc: { likesCount: 1 } },
    );
  }
  async decreaseLikeCounter(_id: string) {
    await this.CommentModel.updateOne(
      { _id, deletedAt: null },
      { $inc: { likesCount: -1 } },
    );
  }
  async increaseDislikeCounter(_id: string) {
    await this.CommentModel.updateOne(
      { _id, deletedAt: null },
      { $inc: { dislikesCount: 1 } },
    );
  }
  async decreaseDislikeCounter(_id: string) {
    await this.CommentModel.updateOne(
      { _id, deletedAt: null },
      { $inc: { dislikesCount: -1 } },
    );
  }
}

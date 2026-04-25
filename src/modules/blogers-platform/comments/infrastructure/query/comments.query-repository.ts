import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../../domain/comment.entity';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { Error as MongooseError, FilterQuery } from 'mongoose';
import { GetCommentsQueryParams } from '../../../posts/api/input-dto/get-comments-query-params.input-dto';
import { CoreConfig } from '../../../../../core/core.config';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    private coreConfig: CoreConfig,
    @InjectModel(Comment.name)
    private readonly CommentModel: CommentModelType,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('CommentsQueryRepository created');
  }

  private async findById(id: string): Promise<CommentDocument | null> {
    try {
      return this.CommentModel.findOne({
        _id: id,
        deletedAt: null,
      });
    } catch (e) {
      if (e instanceof MongooseError.CastError) return null; // невалидный id → «не найдено»
      throw e; // обрыв коннекта и пр. → 500
    }
  }
  private async getComments(
    query: GetCommentsQueryParams,
    filter: FilterQuery<Comment>,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const [comments, totalCount] = await Promise.all([
      this.CommentModel.find(filter)
        .sort({ [query.sortBy]: query.sortDirection })
        .skip(query.calculateSkip())
        .limit(query.pageSize)
        .lean(),
      this.CommentModel.countDocuments(filter),
    ]);

    const items = comments.map((el: CommentDocument) =>
      CommentViewDto.mapToView(el),
    );

    return PaginatedViewDto.mapToView<CommentViewDto[]>({
      items,
      totalCount,
      page: query.pageNumber,
      pageSize: query.pageSize,
    });
  }

  async getById(id: string): Promise<CommentViewDto | null> {
    const commentDocument = await this.findById(id);

    if (!commentDocument) return null;

    return CommentViewDto.mapToView(commentDocument);
  }

  async getPostComments(
    query: GetCommentsQueryParams,
    postId: string,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    return this.getComments(query, { deletedAt: null, postId });
  }
}

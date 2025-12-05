import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../../domain/comment.entity';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { FilterQuery } from 'mongoose';
import { GetCommentsQueryParams } from '../../../posts/api/input-dto/get-comments-query-params.input-dto';
import { appConfig } from '../../../../../core/settings/config';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private readonly CommentModel: CommentModelType,
  ) {
    if (appConfig.IOC_LOG) console.log('CommentsQueryRepository created');
  }

  private async findById(_id: string): Promise<CommentDocument | null> {
    return this.CommentModel.findOne({
      _id,
      deletedAt: null,
    }).catch(() => null);
  }
  private async getComments(
    query: GetCommentsQueryParams,
    filter: FilterQuery<Comment>,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const comments: CommentDocument[] = await this.CommentModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .lean();

    const totalCount = await this.CommentModel.countDocuments(filter);

    const items = comments.map((el: CommentDocument) =>
      CommentViewDto.mapToView(el),
    );

    return PaginatedViewDto.mapToView<CommentViewDto[]>({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
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

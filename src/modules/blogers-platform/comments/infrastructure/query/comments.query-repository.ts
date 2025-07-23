import { Injectable, NotFoundException } from '@nestjs/common';
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
import {
  Post,
  PostDocument,
  PostModelType,
} from '../../../posts/domain/post.entity';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private readonly CommentModel: CommentModelType,
    @InjectModel(Post.name)
    private readonly PostModel: PostModelType,
  ) {
    console.log('CommentsQueryRepository created');
  }

  async findById(id: string): Promise<CommentDocument | null> {
    return this.CommentModel.findOne({
      _id: id,
      deletedAt: null,
    }).catch(() => null);
  }

  async getByIdOrNotFoundFail(id: string): Promise<CommentViewDto> {
    const commentDocument = await this.findById(id);

    if (!commentDocument) {
      throw new NotFoundException('comment not found');
    }

    return CommentViewDto.mapToView(commentDocument);
  }

  async findPostById(id: string): Promise<PostDocument | null> {
    return this.PostModel.findOne({
      _id: id,
      deletedAt: null,
    }).catch(() => null);
  }
  //todo with userId - from auth layer
  async getAll(
    query: GetCommentsQueryParams,
    postId?: string,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const filter: FilterQuery<Comment> = {
      deletedAt: null,
    };

    if (postId) {
      const postDocument = await this.findPostById(postId);
      if (!postDocument) {
        throw new NotFoundException('post not found');
      }

      filter.$and = filter.$and || [];
      filter.$and.push({
        postId,
      });
    }

    const comments: CommentDocument[] = await this.CommentModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .lean();
    const totalCount = await this.CommentModel.countDocuments(filter);

    const items: CommentViewDto[] = comments.map((el: CommentDocument) =>
      CommentViewDto.mapToView(el),
    );

    return PaginatedViewDto.mapToView<CommentViewDto[]>({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}

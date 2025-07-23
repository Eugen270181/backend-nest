import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { FilterQuery } from 'mongoose';
import { Post, PostDocument, PostModelType } from '../../domain/post.entity';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { GetPostsQueryParams } from '../../../blogs/api/input-dto/get-posts-query-params.input-dto';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private readonly PostModel: PostModelType,
  ) {
    console.log('PostsQueryRepository created');
  }

  async findById(id: string): Promise<PostDocument | null> {
    return this.PostModel.findOne({
      _id: id,
      deletedAt: null,
    }).catch(() => null);
  }

  async getByIdOrNotFoundFail(id: string): Promise<PostViewDto> {
    const postDocument: PostDocument | null = await this.findById(id);

    if (!postDocument) {
      throw new NotFoundException('post not found');
    }

    return PostViewDto.mapToView(postDocument);
  }
  //todo with userId
  async getAll(
    query: GetPostsQueryParams,
    blogId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter: FilterQuery<Post> = {
      deletedAt: null,
    };

    if (blogId) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        blogId,
      });
    }

    const posts: PostDocument[] = await this.PostModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .lean();
    const totalCount = await this.PostModel.countDocuments(filter);

    const items: PostViewDto[] = posts.map((el: PostDocument) =>
      PostViewDto.mapToView(el),
    );

    return PaginatedViewDto.mapToView<PostViewDto[]>({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}

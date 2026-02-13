import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { FilterQuery } from 'mongoose';
import { Post, PostDocument, PostModelType } from '../../domain/post.entity';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { GetPostsQueryParams } from '../../../blogs/api/input-dto/get-posts-query-params.input-dto';
import { appConfig } from '../../../../../core/settings/config';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private readonly PostModel: PostModelType,
  ) {
    if (appConfig.IOC_LOG) console.log('PostsQueryRepository created');
  }

  private async findById(_id: string): Promise<PostDocument | null> {
    return this.PostModel.findOne({
      _id,
      deletedAt: null,
    }).catch(() => null);
  }
  private async getPosts(
    filter: FilterQuery<Post>,
    query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const posts: PostDocument[] = await this.PostModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .lean();

    const totalCount = await this.PostModel.countDocuments(filter);

    const items = posts.map((el: PostDocument) => PostViewDto.mapToView(el));

    return PaginatedViewDto.mapToView<PostViewDto[]>({
      items,
      totalCount,
      page: query.pageNumber,
      pageSize: query.pageSize,
    });
  }
  ///////////////////////////////////////////////////////////////////////////////
  async getById(id: string): Promise<PostViewDto | null> {
    const postDocument: PostDocument | null = await this.findById(id);

    if (!postDocument) return null;

    return PostViewDto.mapToView(postDocument);
  }

  async getBlogPosts(
    query: GetPostsQueryParams,
    blogId: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.getPosts({ deletedAt: null, blogId }, query);
  }

  async getAll(
    query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.getPosts({ deletedAt: null }, query);
  }
}

import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetPostsQueryParams } from '../../../blogs/api/input-dto/get-posts-query-params.input-dto';
import { PostsQueryRepository } from '../../infrastructure/query/posts.query-repository';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { GetBlogDocumentQuery } from '../../../blogs/application/queries/get-blog-document.query';
import { BlogDocument } from '../../../blogs/domain/blog.entity';
import { CoreConfig } from '../../../../../core/core.config';

export class GetBlogPostsQuery {
  constructor(
    public readonly blogId: string,
    public readonly query: GetPostsQueryParams,
  ) {}
}

@QueryHandler(GetBlogPostsQuery)
export class GetBlogPostsQueryHandler
  implements IQueryHandler<GetBlogPostsQuery, PaginatedViewDto<PostViewDto[]>>
{
  constructor(
    private coreConfig: CoreConfig,
    private queryBus: QueryBus,
    private postsQueryRepository: PostsQueryRepository,
  ) {
    if (this.coreConfig.IOC_LOG)
      console.log('GetBlogPostsQueryHandler created');
  }

  async execute({
    blogId,
    query,
  }: GetBlogPostsQuery): Promise<PaginatedViewDto<PostViewDto[]>> {
    // 0. Проверяем наличие блога по айди (404, если блога нет)
    await this.queryBus.execute<GetBlogDocumentQuery, BlogDocument>(
      new GetBlogDocumentQuery(blogId),
    );
    // 1. Лайки пока заглушка, поэтому отдаём список из репозитория как есть
    return this.postsQueryRepository.getBlogPosts(query, blogId);
  }
}

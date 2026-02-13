import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { appConfig } from '../../../../../core/settings/config';
import { GetPostsQueryParams } from '../../../blogs/api/input-dto/get-posts-query-params.input-dto';
import { PostsQueryRepository } from '../../infrastructure/query/posts.query-repository';
import { PostEnrichmentService } from '../services/post-enrichment.service';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { GetBlogDocumentQuery } from '../../../blogs/application/queries/get-blog-document.query';
import { BlogDocument } from '../../../blogs/domain/blog.entity';

export class GetBlogPostsQuery {
  constructor(
    public readonly blogId: string,
    public readonly query: GetPostsQueryParams,
    public readonly userId?: string,
  ) {}
}

@QueryHandler(GetBlogPostsQuery)
export class GetBlogPostsQueryHandler
  implements IQueryHandler<GetBlogPostsQuery, PaginatedViewDto<PostViewDto[]>>
{
  constructor(
    private queryBus: QueryBus,
    private postsQueryRepository: PostsQueryRepository,
    private postEnrichmentService: PostEnrichmentService,
  ) {
    if (appConfig.IOC_LOG) console.log('GetBlogPostsQueryHandler created');
  }

  async execute({
    blogId,
    query,
    userId,
  }: GetBlogPostsQuery): Promise<PaginatedViewDto<PostViewDto[]>> {
    // 0. Проверяем наличие блога по айди
    await this.queryBus.execute<GetBlogDocumentQuery, BlogDocument>(
      new GetBlogDocumentQuery(blogId),
    );
    // 1. Получаем базовый список из репозитория
    const paginated = await this.postsQueryRepository.getBlogPosts(
      query,
      blogId,
    );

    // 2. ✅ Параллельно обогащаем все посты
    paginated.items = await Promise.all(
      paginated.items.map((post) => {
        return this.postEnrichmentService.enrich(post, userId);
      }),
    );

    return paginated;
  }
}

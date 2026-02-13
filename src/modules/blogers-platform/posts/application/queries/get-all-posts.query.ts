import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { appConfig } from '../../../../../core/settings/config';
import { GetPostsQueryParams } from '../../../blogs/api/input-dto/get-posts-query-params.input-dto';
import { PostsQueryRepository } from '../../infrastructure/query/posts.query-repository';
import { PostEnrichmentService } from '../services/post-enrichment.service';
import { PostViewDto } from '../../api/view-dto/post.view-dto';

export class GetAllPostsQuery {
  constructor(
    public readonly query: GetPostsQueryParams,
    public readonly userId?: string,
  ) {}
}

@QueryHandler(GetAllPostsQuery)
export class GetAllPostsQueryHandler
  implements IQueryHandler<GetAllPostsQuery, PaginatedViewDto<PostViewDto[]>>
{
  constructor(
    private postsQueryRepository: PostsQueryRepository,
    private postEnrichmentService: PostEnrichmentService,
  ) {
    if (appConfig.IOC_LOG) console.log('GetAllPostsQueryHandler created');
  }

  async execute({
    query,
    userId,
  }: GetAllPostsQuery): Promise<PaginatedViewDto<PostViewDto[]>> {
    //return this.postsQueryRepository.getAll(query);
    // 1. Получаем базовый список из репозитория
    const paginated = await this.postsQueryRepository.getAll(query);

    // 2. ✅ Параллельно обогащаем все посты
    paginated.items = await Promise.all(
      paginated.items.map((post) => {
        return this.postEnrichmentService.enrich(post, userId);
      }),
    );

    return paginated;
  }
}

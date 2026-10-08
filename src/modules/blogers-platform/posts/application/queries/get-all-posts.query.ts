import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetPostsQueryParams } from '../../../blogs/api/input-dto/get-posts-query-params.input-dto';
import { PostsQueryRepository } from '../../infrastructure/query/posts.query-repository';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { CoreConfig } from '../../../../../core/core.config';

export class GetAllPostsQuery {
  constructor(public readonly query: GetPostsQueryParams) {}
}

@QueryHandler(GetAllPostsQuery)
export class GetAllPostsQueryHandler
  implements IQueryHandler<GetAllPostsQuery, PaginatedViewDto<PostViewDto[]>>
{
  constructor(
    private coreConfig: CoreConfig,
    private postsQueryRepository: PostsQueryRepository,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('GetAllPostsQueryHandler created');
  }

  async execute({
    query,
  }: GetAllPostsQuery): Promise<PaginatedViewDto<PostViewDto[]>> {
    //лайки пока заглушка (см. ExtendedLikesInfo), обогащать пост нечем
    return this.postsQueryRepository.getAll(query);
  }
}

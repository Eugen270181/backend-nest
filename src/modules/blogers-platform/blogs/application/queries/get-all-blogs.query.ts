import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs-query-params.input-dto';
import { BlogsQueryRepository } from '../../infrastructure/query/blogs.query-repository';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { appConfig } from '../../../../../core/settings/config';

export class GetAllBlogsQuery {
  constructor(public readonly query: GetBlogsQueryParams) {}
}

@QueryHandler(GetAllBlogsQuery)
export class GetAllBlogsQueryHandler
  implements IQueryHandler<GetAllBlogsQuery, PaginatedViewDto<BlogViewDto[]>>
{
  constructor(private blogsQueryRepository: BlogsQueryRepository) {
    if (appConfig.IOC_LOG) console.log('GetAllBlogsQueryHandler created');
  }

  async execute({
    query,
  }: GetAllBlogsQuery): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.blogsQueryRepository.getAll(query);
  }
}

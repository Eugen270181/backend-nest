import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import { BlogsQueryRepository } from '../../infrastructure/query/blogs.query-repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CoreConfig } from '../../../../../core/core.config';

export class GetBlogQuery {
  constructor(
    public readonly id: string,
    public readonly justCreated: boolean = false,
  ) {}
}

@QueryHandler(GetBlogQuery)
export class GetBlogQueryHandler
  implements IQueryHandler<GetBlogQuery, BlogViewDto>
{
  constructor(
    private coreConfig: CoreConfig,
    private blogsQueryRepository: BlogsQueryRepository,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('GetBlogQueryHandler created');
  }

  async execute({ id, justCreated }: GetBlogQuery): Promise<BlogViewDto> {
    const blogViewDto = await this.blogsQueryRepository.getById(id);

    if (!blogViewDto) {
      if (!justCreated) {
        throw new DomainException({
          code: DomainExceptionCode.NotFound,
          message: `Blog not found: ${id}`,
        });
      } else {
        throw new Error(`Just Created Blog with id:${id} - Not found`);
      }
    }

    return blogViewDto;
  }
}

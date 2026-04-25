import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { BlogDocument } from '../../domain/blog.entity';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CoreConfig } from '../../../../../core/core.config';

export class GetBlogDocumentQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetBlogDocumentQuery)
export class GetBlogDocumentQueryHandler
  implements IQueryHandler<GetBlogDocumentQuery, BlogDocument>
{
  constructor(
    private coreConfig: CoreConfig,
    private readonly blogsRepository: BlogsRepository,
  ) {
    if (this.coreConfig.IOC_LOG)
      console.log('GetBlogDocumentQueryHandler created');
  }

  async execute({ id }: GetBlogDocumentQuery): Promise<BlogDocument> {
    const blogDocument = await this.blogsRepository.findById(id);

    if (!blogDocument) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `Blog with id:${id} - not found`,
      });
    }

    return blogDocument;
  }
}

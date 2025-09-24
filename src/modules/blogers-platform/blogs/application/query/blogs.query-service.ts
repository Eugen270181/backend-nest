import { BlogsQueryRepository } from '../../infrastructure/query/blogs.query-repository';
import { Injectable } from '@nestjs/common';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { appConfig } from '../../../../../core/settings/config';

@Injectable()
export class BlogsQueryService {
  constructor(private readonly blogsQueryRepository: BlogsQueryRepository) {
    if (appConfig.IOC_LOG) console.log('BlogsQueryService created');
  }

  async getBlogViewDtoOrFail(
    id: string,
    justCreated: boolean = false,
  ): Promise<BlogViewDto> {
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

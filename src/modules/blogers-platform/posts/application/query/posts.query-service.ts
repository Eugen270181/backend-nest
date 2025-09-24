import { PostsQueryRepository } from '../../infrastructure/query/posts.query-repository';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { GetPostsQueryParams } from '../../../blogs/api/input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { BlogsQueryService } from '../../../blogs/application/query/blogs.query-service';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';
import { appConfig } from '../../../../../core/settings/config';

@Injectable()
export class PostsQueryService {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly blogsQueryService: BlogsQueryService,
    private readonly blogsRepository: BlogsRepository,
  ) {
    if (appConfig.IOC_LOG) console.log('PostsQueryService created');
  }

  private async checkBlogOrFail(id: string) {
    const blogDocument = await this.blogsRepository.findById(id);

    if (!blogDocument) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `blog not found: ${id}`,
      });
    }
  }

  async getPostViewDtoOrFail(
    id: string,
    justCreated: boolean = false,
  ): Promise<PostViewDto> {
    const postViewDto = await this.postsQueryRepository.getById(id);

    if (!postViewDto) {
      if (!justCreated) {
        throw new DomainException({
          code: DomainExceptionCode.NotFound,
          message: `Post with id:${id} - Not found`,
        });
      } else {
        throw new Error(`Just Created Post with id:${id} - Not found`);
      }
    }

    return postViewDto;
  }

  async getBlogPosts(
    blogId: string,
    query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    await this.checkBlogOrFail(blogId);

    return this.postsQueryRepository.getBlogPosts(blogId, query);
  }
}

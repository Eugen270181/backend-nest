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
import { PostsRepository } from '../../infrastructure/posts.repository';
import { LikesCommentsRepository } from '../../../likes/infrastructure/likes-comments.repository';
import { LikesPostsRepository } from '../../../likes/infrastructure/likes-posts.repository';
import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';

@Injectable()
export class PostsQueryService {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly blogsRepository: BlogsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly likesPostsRepository: LikesPostsRepository,
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

  private async checkPostOrFail(id: string) {
    const postDocument = await this.postsRepository.findById(id);

    if (!postDocument) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `post not found: ${id}`,
      });
    }
  }

  // ✅ Переиспользуемый метод
  private async enrichPostWithLikes(
    postViewDto: PostViewDto,
    userId?: string,
  ): Promise<PostViewDto> {
    if (!userId) return postViewDto;

    const myLike =
      await this.likesPostsRepository.findLikePostByAuthorIdAndPostId(
        userId,
        postViewDto.id,
      );

    postViewDto.setMyLikeStatus(myLike?.likeStatus ?? LikeStatus.None);
    return postViewDto;
  }
//todo with userId
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

    return this.postsQueryRepository.getBlogPosts(query, blogId);
  }
}

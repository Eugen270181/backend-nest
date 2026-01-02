import { PostsQueryRepository } from '../../infrastructure/query/posts.query-repository';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { GetPostsQueryParams } from '../../../blogs/api/input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';
import { appConfig } from '../../../../../core/settings/config';
import { LikesPostsRepository } from '../../../likes/infrastructure/likes-posts.repository';
import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';

@Injectable()
export class PostsQueryService {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly blogsRepository: BlogsRepository,
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

  // ✅ Переиспользуемый метод
  private async enrichPostWithLikes(postViewDto: PostViewDto, userId?: string) {
    // 1. Получаем 3 последних лайка (только Like, не Dislike)
    const newestLikesDocuments = await this.likesPostsRepository.getNewestLikes(
      postViewDto.id,
      3,
    );

    // 2. Получаем статус текущего пользователя
    let myStatus = LikeStatus.None;
    if (userId) {
      const myLike =
        await this.likesPostsRepository.findLikePostByAuthorIdAndPostId(
          userId,
          postViewDto.id,
        );
      myStatus = myLike?.likeStatus ?? LikeStatus.None;
      console.log(myStatus);
    }

    // 3. ✅ Обогащаем DTO через методы
    postViewDto.setMyLikeStatus(myStatus);
    postViewDto.enrichWithNewestLikes(newestLikesDocuments);

    return postViewDto;
  }

  async getById(id: string, userId?: string): Promise<PostViewDto | null> {
    const postViewDto = await this.postsQueryRepository.getById(id);
    if (!postViewDto) return null;

    return this.enrichPostWithLikes(postViewDto, userId);
  }
  //////////////////////////////////////////////////////////////////////////////
  async getPostViewDtoOrFail(
    id: string,
    userId?: string,
    justCreated: boolean = false,
  ): Promise<PostViewDto> {
    const postViewDto = await this.getById(id, userId);
    console.log(userId);
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
    userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    await this.checkBlogOrFail(blogId);

    const paginated = await this.postsQueryRepository.getBlogPosts(
      query,
      blogId,
    );
    console.log(userId);
    // ✅ Переиспользуем метод параллельно
    paginated.items = await Promise.all(
      paginated.items.map((post) => this.enrichPostWithLikes(post, userId)),
    );

    return paginated;
  }

  async getAll(
    query: GetPostsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    // 1. Получаем базовый список из репозитория
    const paginated = await this.postsQueryRepository.getAll(query);

    // 2. ✅ Параллельно обогащаем все посты
    paginated.items = await Promise.all(
      paginated.items.map((post) => {
        return this.enrichPostWithLikes(post, userId);
      }),
    );

    return paginated;
  }
}

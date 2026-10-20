import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { OptionalUserId } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';

import { BlogViewDto } from './view-dto/blog.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { PostViewDto } from '../../posts/api/view-dto/post.view-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { QueryBus } from '@nestjs/cqrs';
import { GetBlogQuery } from '../application/queries/get-blog.query';
import { GetAllBlogsQuery } from '../application/queries/get-all-blogs.query';
import { GetBlogPostsQuery } from '../../posts/application/queries/get-blog-posts.query';
import { CoreConfig } from '../../../../core/core.config';

//Публичный API блогов: только чтение.
//Создание/изменение/удаление - в SA API: BlogsSaController (/sa/blogs)
@Controller('blogs')
export class BlogsController {
  constructor(
    private coreConfig: CoreConfig,
    private readonly queryBus: QueryBus,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('BlogsController created');
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<BlogViewDto> {
    return this.queryBus.execute<GetBlogQuery, BlogViewDto>(
      new GetBlogQuery(id),
    );
  }

  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.queryBus.execute<
      GetAllBlogsQuery,
      PaginatedViewDto<BlogViewDto[]>
    >(new GetAllBlogsQuery(query));
  }

  //опциональный токен: нужен для myStatus в лайках постов (аноним -> None)
  @UseGuards(JwtOptionalAuthGuard)
  @Get(':blogId/posts')
  async getBlogPosts(
    @Param('blogId') blogId: string,
    @Query() query: GetPostsQueryParams,
    @OptionalUserId() userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.queryBus.execute<
      GetBlogPostsQuery,
      PaginatedViewDto<PostViewDto[]>
    >(new GetBlogPostsQuery(blogId, query, userId));
  }
}

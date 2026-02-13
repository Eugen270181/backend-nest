import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogViewDto } from './view-dto/blog.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CreateBlogInputDto } from './input-dto/create-blog.input-dto';
import { UpdateBlogInputDto } from './input-dto/update-blog.input-dto';
import { PostViewDto } from '../../posts/api/view-dto/post.view-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { CreateBlogPostInputDto } from './input-dto/create-blog-post.input-dto';
import { CreatePostDto } from '../../posts/application/dto/post.dto';

import { UpdateBlogDto } from '../application/dto/blog.dto';
import { appConfig } from '../../../../core/settings/config';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { Public } from '../../../user-accounts/guards/decorators/public.decorator';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { OptionalUserId } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../application/usecases/create-blog.usecase';
import { GetBlogQuery } from '../application/queries/get-blog.query';
import { UpdateBlogCommand } from '../application/usecases/update-blog.usecase';
import { DeleteBlogCommand } from '../application/usecases/delete-blog.usecase';
import { GetAllBlogsQuery } from '../application/queries/get-all-blogs.query';
import { GetPostQuery } from '../../posts/application/queries/get-post.query';
import { CreatePostCommand } from '../../posts/application/usecases/create-post.usecase';
import { GetBlogPostsQuery } from '../../posts/application/queries/get-blog-posts.query';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    if (appConfig.IOC_LOG) console.log('BlogsController created');
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

  @UseGuards(BasicAuthGuard)
  @Post()
  async createBlog(
    @Body() createBlogInputDto: CreateBlogInputDto,
  ): Promise<BlogViewDto> {
    const blogId = await this.commandBus.execute<CreateBlogCommand, string>(
      new CreateBlogCommand(createBlogInputDto),
    );

    return this.queryBus.execute<GetBlogQuery, BlogViewDto>(
      new GetBlogQuery(blogId, true),
    );
  }

  @UseGuards(BasicAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') id: string,
    @Body() updateBlogInputDto: UpdateBlogInputDto,
  ) {
    const updateBlogDto: UpdateBlogDto = {
      ...updateBlogInputDto,
      id,
    };

    await this.commandBus.execute<UpdateBlogCommand>(
      new UpdateBlogCommand(updateBlogDto),
    );
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string) {
    await this.commandBus.execute<DeleteBlogCommand>(new DeleteBlogCommand(id));
  }

  //////////////////////////////////////////////////////////
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

  @UseGuards(BasicAuthGuard)
  @Post(':blogId/posts')
  async createBlogPost(
    @Param('blogId') blogId: string,
    @Body() createBlogPostInputDto: CreateBlogPostInputDto,
  ): Promise<PostViewDto> {
    const createPostDto: CreatePostDto = {
      ...createBlogPostInputDto,
      blogId,
    };

    const postId = await this.commandBus.execute<CreatePostCommand, string>(
      new CreatePostCommand(createPostDto),
    );

    return this.queryBus.execute<GetPostQuery, PostViewDto>(
      new GetPostQuery(postId, undefined, true),
    );
  }
}

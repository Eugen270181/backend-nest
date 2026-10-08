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
import { ApiBasicAuth } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { BlogViewDto } from './view-dto/blog.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CreateBlogInputDto } from './input-dto/create-blog.input-dto';
import { UpdateBlogInputDto } from './input-dto/update-blog.input-dto';
import { PostViewDto } from '../../posts/api/view-dto/post.view-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { CreateBlogPostInputDto } from './input-dto/create-blog-post.input-dto';
import { UpdatePostInputDto } from '../../posts/api/input-dto/update-post.input-dto';
import {
  CreatePostDto,
  UpdatePostDto,
} from '../../posts/application/dto/post.dto';
import { UpdateBlogDto } from '../application/dto/blog.dto';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { CreateBlogCommand } from '../application/usecases/create-blog.usecase';
import { GetBlogQuery } from '../application/queries/get-blog.query';
import { UpdateBlogCommand } from '../application/usecases/update-blog.usecase';
import { DeleteBlogCommand } from '../application/usecases/delete-blog.usecase';
import { GetAllBlogsQuery } from '../application/queries/get-all-blogs.query';
import { GetPostQuery } from '../../posts/application/queries/get-post.query';
import { CreatePostCommand } from '../../posts/application/usecases/create-post.usecase';
import { UpdatePostCommand } from '../../posts/application/usecases/update-post.usecase';
import { DeletePostCommand } from '../../posts/application/usecases/delete-post.usecase';
import { GetBlogPostsQuery } from '../../posts/application/queries/get-blog-posts.query';
import { CoreConfig } from '../../../../core/core.config';

//Super Admin API: блоги и посты (Basic auth).
//Посты управляются через блог: /sa/blogs/:blogId/posts[/:postId]
@UseGuards(BasicAuthGuard)
@ApiBasicAuth('basicAuth')
@Controller('sa/blogs')
@SkipThrottle()
export class BlogsSaController {
  constructor(
    private coreConfig: CoreConfig,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('BlogsSaController created');
  }

  /////////////////////////////// blogs ///////////////////////////////
  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.queryBus.execute<
      GetAllBlogsQuery,
      PaginatedViewDto<BlogViewDto[]>
    >(new GetAllBlogsQuery(query));
  }

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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string) {
    await this.commandBus.execute<DeleteBlogCommand>(new DeleteBlogCommand(id));
  }

  /////////////////////////////// posts of blog ///////////////////////////////
  @Get(':blogId/posts')
  async getBlogPosts(
    @Param('blogId') blogId: string,
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.queryBus.execute<
      GetBlogPostsQuery,
      PaginatedViewDto<PostViewDto[]>
    >(new GetBlogPostsQuery(blogId, query));
  }

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
      new GetPostQuery(postId, true),
    );
  }

  @Put(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlogPost(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() updatePostInputDto: UpdatePostInputDto,
  ) {
    const updatePostDto: UpdatePostDto = {
      ...updatePostInputDto,
      blogId,
      postId,
    };

    await this.commandBus.execute<UpdatePostCommand>(
      new UpdatePostCommand(updatePostDto),
    );
  }

  @Delete(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlogPost(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ) {
    await this.commandBus.execute<DeletePostCommand>(
      new DeletePostCommand(blogId, postId),
    );
  }
}

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
import { BlogsService } from '../application/blogs.service';
import { ApiParam } from '@nestjs/swagger';
import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';
import { BlogViewDto } from './view-dto/blog.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CreateBlogInputDto } from './input-dto/create-blog.input-dto';
import { UpdateBlogInputDto } from './input-dto/update-blog.input-dto';
import { PostViewDto } from '../../posts/api/view-dto/post.view-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { PostsService } from '../../posts/application/posts.service';
import { CreateBlogPostInputDto } from './input-dto/create-blog-post.input-dto';
import { CreatePostDto } from '../../posts/application/dto/post.dto';
import { BlogsQueryService } from '../application/query/blogs.query-service';
import { PostsQueryService } from '../../posts/application/query/posts.query-service';
import { UpdateBlogDto } from '../application/dto/blog.dto';
import { appConfig } from '../../../../core/settings/config';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { Public } from '../../../user-accounts/guards/decorators/public.decorator';

@UseGuards(BasicAuthGuard)
@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly blogsQueryService: BlogsQueryService,
    private readonly blogsService: BlogsService,
    private readonly postsQueryService: PostsQueryService,
    private readonly postsService: PostsService,
  ) {
    if (appConfig.IOC_LOG) console.log('BlogsController created');
  }

  @Public()
  @Get(':id')
  async getById(@Param('id') id: string): Promise<BlogViewDto> {
    return this.blogsQueryService.getBlogViewDtoOrFail(id);
  }

  @Public()
  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.blogsQueryRepository.getAll(query);
  }

  @Post()
  async createBlog(
    @Body() createBlogInputDto: CreateBlogInputDto,
  ): Promise<BlogViewDto> {
    const blogId = await this.blogsService.createBlog(createBlogInputDto);

    return this.blogsQueryService.getBlogViewDtoOrFail(blogId, true);
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
    await this.blogsService.updateBlog(updateBlogDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string): Promise<void> {
    return this.blogsService.deleteBlogById(id);
  }

  //////////////////////////////////////////////////////////
  @Public()
  @Get(':blogId/posts')
  async getBlogPosts(
    @Param('blogId') blogId: string,
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.postsQueryService.getBlogPosts(blogId, query);
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

    const postId = await this.postsService.createPost(createPostDto);

    return this.postsQueryService.getPostViewDtoOrFail(postId, undefined, true);
  }
}

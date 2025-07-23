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
import { PostsQueryRepository } from '../../posts/infrastructure/query/posts.query-repository';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { PostsService } from '../../posts/application/posts.service';
import { CreateBlogPostInputDto } from './input-dto/create-blog-post.input-dto';
import { CreatePostDto } from '../../posts/dto/post.dto';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly blogsService: BlogsService,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly postsService: PostsService,
  ) {
    console.log('BlogsController created');
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<BlogViewDto> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.blogsQueryRepository.getAll(query);
  }

  @Post()
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewDto> {
    const blogId = await this.blogsService.createBlog(body);

    return this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
  }

  @ApiParam({ name: 'id' }) //для сваггера
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') id: string,
    @Body() body: UpdateBlogInputDto,
  ): Promise<BlogViewDto> {
    const blogId = await this.blogsService.updateBlog(id, body);

    return this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
  }

  @ApiParam({ name: 'id' }) //для сваггера
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string): Promise<void> {
    return this.blogsService.deleteBlogById(id);
  }

  //////////////////////////////////////////////////////////
  //todo get&post for blog/blogId/Post
  @Get(':id/posts')
  async getBlogPosts(
    @Query() query: GetPostsQueryParams,
    @Param('id') id: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    await this.blogsQueryRepository.getByIdOrNotFoundFail(id);
    //todo move this check for id to next method
    return this.postsQueryRepository.getAll(query, id);
  }

  @Post(':id/posts')
  async createBlogPost(
    @Body() body: CreateBlogPostInputDto,
    @Param('id') blogId: string,
  ): Promise<PostViewDto> {
    const createPostDto: CreatePostDto = { ...body, blogId };
    const postId = await this.postsService.createPost(createPostDto);

    return this.postsQueryRepository.getByIdOrNotFoundFail(postId);
  }
}

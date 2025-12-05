import { GetPostsQueryParams } from '../../blogs/api/input-dto/get-posts-query-params.input-dto';
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';
import { PostsService } from '../application/posts.service';
import { PostViewDto } from './view-dto/post.view-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CreatePostInputDto } from './input-dto/create-post.input-dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UpdatePostInputDto } from './input-dto/update-post.input-dto';
import { GetCommentsQueryParams } from './input-dto/get-comments-query-params.input-dto';
import { CommentViewDto } from '../../comments/api/view-dto/comment.view-dto';
import { CommentsQueryRepository } from '../../comments/infrastructure/query/comments.query-repository';
import { CreatePostDto, UpdatePostDto } from '../application/dto/post.dto';
import { PostsQueryService } from '../application/query/posts.query-service';
import { appConfig } from '../../../../core/settings/config';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { CreateBlogPostInputDto } from '../../blogs/api/input-dto/create-blog-post.input-dto';
import { CommentsQueryService } from '../../comments/application/query/comments.query-service';
import { CreateCommentInputDto } from '../../comments/api/input-dto/create-comment.input-dto';
import { CreateCommentDto } from '../../comments/application/dto/comment.dto';
import { CommentsService } from '../../comments/application/comments.service';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import {
  ExtractUserFromRequest,
  ExtractUserIdFromRequest,
} from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly postsQueryService: PostsQueryService,
    private readonly postsService: PostsService,
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly commentsQueryService: CommentsQueryService,
    private readonly commentsService: CommentsService,
  ) {
    if (appConfig.IOC_LOG) console.log('Posts Controller created');
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<PostViewDto> {
    return this.postsQueryService.getPostViewDtoOrFail(id);
  }

  @Get()
  async getAll(
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.postsQueryRepository.getAll(query);
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createPost(
    @Body() createPostInputDto: CreatePostInputDto,
  ): Promise<PostViewDto> {
    const postId = await this.postsService.createPost(createPostInputDto);

    return this.postsQueryService.getPostViewDtoOrFail(postId, true);
  }

  @UseGuards(BasicAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostInputDto: UpdatePostInputDto,
  ) {
    const updatePostDto: UpdatePostDto = { ...updatePostInputDto, id };
    await this.postsService.updatePost(updatePostDto);
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string) {
    await this.postsService.deletePostById(id);
  }
  ///////////////////////////////////////////////////////////////////
  //todo release post and get req for comments entity accros postId && put 4likestatus
  @Get(':postId/comments')
  async getPostComments(
    @Query() query: GetCommentsQueryParams,
    @Param('postId') postId: string,
    @ExtractUserFromRequest() user: UserContextDto | null,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    await this.postsQueryService.getPostViewDtoOrFail(postId);

    return this.commentsQueryService.getPostComments(query, postId, user?.id);
  }

  @ApiBearerAuth()
  @Post(':postId/comments')
  @UseGuards(JwtAuthGuard)
  async createPostComment(
    @ExtractUserIdFromRequest() userId: string,
    @Body() createCommentInputDto: CreateCommentInputDto,
    @Param('postId') postId: string,
  ): Promise<CommentViewDto> {
    const createCommentDto: CreateCommentDto = {
      ...createCommentInputDto,
      postId,
      userId,
    };
    const commentId =
      await this.commentsService.createComment(createCommentDto);

    return this.commentsQueryService.getCommentViewDtoOrFail(
      commentId,
      userId,
      true,
    );
  }
}

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
  OptionalUserId,
  UserId,
} from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { LikePostInputDto } from './input-dto/like-post.input-dto';
import { LikePostDto } from '../../likes/application/dto/like-post.dto';
import { UseOptionalAuth } from '../../../user-accounts/middlewares/export const with-optional-user.decorator';
import { Public } from '../../../user-accounts/guards/decorators/public.decorator';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';

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

  @UseGuards(JwtOptionalAuthGuard)
  @Get(':postId')
  async getById(
    @Param('postId') postId: string,
    @OptionalUserId() userId?: string,
  ): Promise<PostViewDto> {
    return this.postsQueryService.getPostViewDtoOrFail(postId, userId);
  }

  @UseGuards(JwtOptionalAuthGuard)
  @Get()
  async getAll(
    @Query() query: GetPostsQueryParams,
    @OptionalUserId() userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    console.log(userId);
    return this.postsQueryService.getAll(query, userId);
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createPost(
    @Body() createPostInputDto: CreatePostInputDto,
  ): Promise<PostViewDto> {
    const postId = await this.postsService.createPost(createPostInputDto);

    return this.postsQueryService.getPostViewDtoOrFail(postId, undefined, true);
  }

  @UseGuards(BasicAuthGuard)
  @Put(':postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('postId') postId: string,
    @Body() updatePostInputDto: UpdatePostInputDto,
  ) {
    const updatePostDto: UpdatePostDto = { ...updatePostInputDto, postId };
    await this.postsService.updatePost(updatePostDto);
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('postId') postId: string) {
    await this.postsService.deletePostById(postId);
  }
  ///////////////////////////////////////////////////////////////////
  // ✅ GET комментарии поста — OptionalUserId из middleware
  @UseGuards(JwtOptionalAuthGuard)
  @Get(':postId/comments')
  async getPostComments(
    @Param('postId') postId: string,
    @Query() query: GetCommentsQueryParams,
    @OptionalUserId() userId?: string, // ✅ Из OptionalJwtMiddleware
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    await this.postsQueryService.getPostViewDtoOrFail(postId);
    return this.commentsQueryService.getPostComments(query, postId, userId);
  }

  // ✅ POST комментарий поста — UserId из JwtAuthGuard
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':postId/comments')
  async createPostComment(
    @UserId() userId: string, // ✅ Обязательный из JwtStrategy
    @Param('postId') postId: string,
    @Body() createCommentInputDto: CreateCommentInputDto,
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
  //////////////////////////////////////////////////////////////////////////////
  // ✅ PUT лайк поста UserId из JwtAuthGuard
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':postId/like-status')
  async putLikeStatusById(
    @Param('postId') postId: string,
    @Body() likePostInputDto: LikePostInputDto,
    @UserId() authorId: string,
  ) {
    const likePostDto: LikePostDto = {
      ...likePostInputDto,
      authorId,
      postId,
    };
    return this.postsService.updateLike(likePostDto);
  }
}

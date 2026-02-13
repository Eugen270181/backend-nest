import { GetPostsQueryParams } from '../../blogs/api/input-dto/get-posts-query-params.input-dto';
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
import { UpdatePostDto } from '../application/dto/post.dto';
import { appConfig } from '../../../../core/settings/config';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { CreateCommentInputDto } from '../../comments/api/input-dto/create-comment.input-dto';
import { CreateCommentDto } from '../../comments/application/dto/comment.dto';
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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePostCommand } from '../application/usecases/create-post.usecase';
import { GetPostQuery } from '../application/queries/get-post.query';
import { GetAllPostsQuery } from '../application/queries/get-all-posts.query';
import { UpdatePostCommand } from '../application/usecases/update-post.usecase';
import { DeletePostCommand } from '../application/usecases/delete-post.usecase';
import { UpdatePostLikeCommand } from '../application/usecases/update-post-like.usecase';
import { GetPostDocumentQuery } from '../application/queries/get-post-document.query';
import { CreateCommentCommand } from '../../comments/application/usecases/create-comment.usecase';
import { GetCommentQuery } from '../../comments/application/queries/get-comment.query';
import { GetPostCommentsQuery } from '../../comments/application/queries/get-post-comments.query';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    if (appConfig.IOC_LOG) console.log('Posts Controller created');
  }

  @UseGuards(JwtOptionalAuthGuard)
  @Get(':postId')
  async getById(
    @Param('postId') postId: string,
    @OptionalUserId() userId?: string,
  ): Promise<PostViewDto> {
    return this.queryBus.execute<GetPostQuery, PostViewDto>(
      new GetPostQuery(postId, userId),
    );
  }

  @UseGuards(JwtOptionalAuthGuard)
  @Get()
  async getAll(
    @Query() query: GetPostsQueryParams,
    @OptionalUserId() userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.queryBus.execute<
      GetAllPostsQuery,
      PaginatedViewDto<PostViewDto[]>
    >(new GetAllPostsQuery(query, userId));
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createPost(
    @Body() createPostInputDto: CreatePostInputDto,
  ): Promise<PostViewDto> {
    const postId = await this.commandBus.execute<CreatePostCommand, string>(
      new CreatePostCommand(createPostInputDto),
    );
    return this.queryBus.execute<GetPostQuery, PostViewDto>(
      new GetPostQuery(postId, undefined, true),
    );
    //return this.postsQueryService.getPostViewDtoOrFail(postId, undefined, true);
  }

  @UseGuards(BasicAuthGuard)
  @Put(':postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('postId') postId: string,
    @Body() updatePostInputDto: UpdatePostInputDto,
  ) {
    const updatePostDto: UpdatePostDto = { ...updatePostInputDto, postId };

    await this.commandBus.execute<UpdatePostCommand>(
      new UpdatePostCommand(updatePostDto),
    );
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('postId') postId: string) {
    await this.commandBus.execute<DeletePostCommand>(
      new DeletePostCommand(postId),
    );
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
    await this.queryBus.execute<GetPostDocumentQuery>(
      new GetPostDocumentQuery(postId),
    );
    //todo!!!!
    //return this.commentsQueryService.getPostComments(query, postId, userId);
    return this.queryBus.execute<
      GetPostCommentsQuery,
      PaginatedViewDto<CommentViewDto[]>
    >(new GetPostCommentsQuery(query, postId, userId));
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
    const commentId = await this.commandBus.execute<
      CreateCommentCommand,
      string
    >(new CreateCommentCommand(createCommentDto));

    return this.queryBus.execute<GetCommentQuery, CommentViewDto>(
      new GetCommentQuery(commentId, userId, true),
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

    await this.commandBus.execute<UpdatePostLikeCommand>(
      new UpdatePostLikeCommand(likePostDto),
    );
  }
}

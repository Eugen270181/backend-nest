import { GetPostsQueryParams } from '../../blogs/api/input-dto/get-posts-query-params.input-dto';
import { PostViewDto } from './view-dto/post.view-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetCommentsQueryParams } from './input-dto/get-comments-query-params.input-dto';
import { CommentViewDto } from '../../comments/api/view-dto/comment.view-dto';
import { CreateCommentInputDto } from '../../comments/api/input-dto/create-comment.input-dto';
import { CreateCommentDto } from '../../comments/application/dto/comment.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import {
  OptionalUserId,
  UserId,
} from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { LikePostInputDto } from './input-dto/like-post.input-dto';
import { LikePostDto } from '../../likes/application/dto/like-post.dto';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetPostQuery } from '../application/queries/get-post.query';
import { GetAllPostsQuery } from '../application/queries/get-all-posts.query';
import { UpdatePostLikeCommand } from '../application/usecases/update-post-like.usecase';
import { GetPostDocumentQuery } from '../application/queries/get-post-document.query';
import { CreateCommentCommand } from '../../comments/application/usecases/create-comment.usecase';
import { GetCommentQuery } from '../../comments/application/queries/get-comment.query';
import { GetPostCommentsQuery } from '../../comments/application/queries/get-post-comments.query';
import { CoreConfig } from '../../../../core/core.config';

//Публичный API постов: только чтение.
//Создание/изменение/удаление постов - в SA API: BlogsSaController (/sa/blogs/:blogId/posts)
@Controller('posts')
export class PostsController {
  constructor(
    private coreConfig: CoreConfig,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('Posts Controller created');
  }

  @Get(':postId')
  async getById(@Param('postId') postId: string): Promise<PostViewDto> {
    return this.queryBus.execute<GetPostQuery, PostViewDto>(
      new GetPostQuery(postId),
    );
  }

  @Get()
  async getAll(
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.queryBus.execute<
      GetAllPostsQuery,
      PaginatedViewDto<PostViewDto[]>
    >(new GetAllPostsQuery(query));
  }

  ///////////////////////////////////////////////////////////////////
  // Комментарии пока живут в Mongo и от поста требуют только его существование
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
  // ЗАГЛУШКА: лайки постов пока не в SQL. Эндпоинт остаётся в API (Swagger),
  // валидирует тело, проверяет что пост есть (404) и отвечает 204, ничего не сохраняя
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

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
import { UpdatePostDto } from '../dto/post.dto';
import { PostsQueryService } from '../application/query/posts.query-service';
import { appConfig } from '../../../../core/settings/config';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly postsService: PostsService,
    private readonly postsQueryService: PostsQueryService,
    private readonly commentsQueryRepository: CommentsQueryRepository,
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
  @Get(':id/comments')
  async getPostComments(
    @Query() query: GetCommentsQueryParams,
    @Param('id') postId: string,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const foundPostDocument = await this.postsQueryRepository.findById(postId);

    if (!foundPostDocument) {
      throw new NotFoundException('Post not found');
    }

    return this.commentsQueryRepository.getPostComments(postId, query);
  }
  //todo uncomment and release in service
  // @Post(':id/comments')
  // async createPostComment(
  //   @Body() createCommentInputDto: CreateCommentInputDto,
  //   @Param('id') postId: string,
  // ): Promise<CommentViewDto> {
  //   //todo with userId
  //   const createCommentDto: CreateCommentDto = {
  //     ...createCommentInputDto,
  //     postId,
  //     userId,
  //   };
  //   const commentId =
  //     await this.commentsService.createComment(createCommentDto);
  //
  //   const commentViewDto =
  //     await this.commentsQueryRepository.getById(commentId);
  //   //todo not domain exceprion - something wrong with DB saving
  //   if (!commentViewDto) {
  //     throw new NotFoundException(
  //       `created comment not found with id ${commentId}`,
  //     );
  //   }
  //
  //   return commentViewDto;
  // }
}

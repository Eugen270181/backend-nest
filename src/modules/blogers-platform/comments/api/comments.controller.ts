import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommentViewDto } from './view-dto/comment.view-dto';
import { CommentsQueryRepository } from '../infrastructure/query/comments.query-repository';
import { CommentsService } from '../application/comments.service';
import { appConfig } from '../../../../core/settings/config';
import { CommentsQueryService } from '../application/query/comments.query-service';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { Public } from '../../../user-accounts/guards/decorators/public.decorator';
import {
  OptionalUserId,
  UserId,
} from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UpdateCommentDto } from '../application/dto/comment.dto';
import { UpdateCommentInputDto } from './input-dto/update-comment.input-dto';
import { LikeCommentInputDto } from './input-dto/like-comment.input-dto';
import { LikeCommentDto } from '../../likes/application/dto/like-comment.dto';
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly commentsQueryService: CommentsQueryService,
  ) {
    if (appConfig.IOC_LOG) console.log('CommentsController created');
  }
  @Public()
  @Get(':commentId')
  async getById(
    @Param('commentId') commentId: string,
    @OptionalUserId() userId?: string,
  ): Promise<CommentViewDto> {
    return this.commentsQueryService.getCommentViewDtoOrFail(commentId, userId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':commentId')
  async delById(
    @Param('commentId') commentId: string,
    @UserId() userId: string,
  ) {
    return this.commentsService.deleteComment(commentId, userId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':commentId')
  async putById(
    @Param('commentId') commentId: string,
    @Body() updateCommentInputDto: UpdateCommentInputDto,
    @UserId() userId: string,
  ) {
    const updateCommentDto: UpdateCommentDto = {
      ...updateCommentInputDto,
      commentId,
      userId,
    };
    return this.commentsService.updateComment(updateCommentDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':commentId/like-status')
  async putLikeStatusById(
    @Param('commentId') commentId: string,
    @Body() likeCommentInputDto: LikeCommentInputDto,
    @UserId() authorId: string,
  ) {
    const likeCommentDto: LikeCommentDto = {
      ...likeCommentInputDto,
      authorId,
      commentId,
    };
    return this.commentsService.updateLike(likeCommentDto);
  }
}

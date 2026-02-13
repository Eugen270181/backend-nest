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
import { appConfig } from '../../../../core/settings/config';
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
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';

import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetCommentQuery } from '../application/queries/get-comment.query';

import { DeleteCommentCommand } from '../application/usecases/delete-comment.usecase';

import { UpdateCommentCommand } from '../application/usecases/update-comment.usecase';

import { UpdateCommentLikeCommand } from '../application/usecases/update-comment-like.usecase';

@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    if (appConfig.IOC_LOG) console.log('CommentsController created');
  }
  @Public()
  @UseGuards(JwtOptionalAuthGuard)
  @Get(':commentId')
  async getById(
    @Param('commentId') commentId: string,
    @OptionalUserId() userId?: string,
  ): Promise<CommentViewDto> {
    return this.queryBus.execute<GetCommentQuery, CommentViewDto>(
      new GetCommentQuery(commentId, userId),
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':commentId')
  async delById(
    @Param('commentId') commentId: string,
    @UserId() userId: string,
  ) {
    await this.commandBus.execute<DeleteCommentCommand>(
      new DeleteCommentCommand(commentId, userId),
    );
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
    await this.commandBus.execute<UpdateCommentCommand>(
      new UpdateCommentCommand(updateCommentDto),
    );
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
    await this.commandBus.execute<UpdateCommentLikeCommand>(
      new UpdateCommentLikeCommand(likeCommentDto),
    );
  }
}

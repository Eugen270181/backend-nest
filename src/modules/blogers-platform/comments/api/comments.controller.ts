import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import { CommentViewDto } from './view-dto/comment.view-dto';
import { CommentsQueryRepository } from '../infrastructure/query/comments.query-repository';
import { CommentsService } from '../application/comments.service';
import { appConfig } from '../../../../core/settings/config';
import { CommentsQueryService } from '../application/query/comments.query-service';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly commentsQueryService: CommentsQueryService,
  ) {
    if (appConfig.IOC_LOG) console.log('CommentsController created');
  }

  @Get(':commentId')
  async getById(
    @Param('commentId') commentId: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<CommentViewDto> {
    return this.commentsQueryService.getCommentViewDtoOrFail(
      commentId,
      user?.id,
    );
  }

  @Delete(':commentId')
  async delById(@Param('commentId') commentId: string) {
    return 'comment.del';
  }

  @Put(':commentId')
  async putById(@Param('commentId') commentId: string) {
    return 'comment.put';
  }

  @Put(':commentId/like-status')
  async putLikeStatusById(@Param('commentId') commentId: string) {
    return 'comment.like-status.put';
  }
}

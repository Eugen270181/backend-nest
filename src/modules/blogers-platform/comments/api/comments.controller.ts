import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { CommentViewDto } from './view-dto/comment.view-dto';
import { CommentsQueryRepository } from '../infrastructure/query/comments.query-repository';
import { CommentsService } from '../application/comments.service';
import { ParamsObjectIdDto } from '../../../../core/dto/params-object-id.dto';
import { appConfig } from '../../../../core/settings/config';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {
    if (appConfig.IOC_LOG) console.log('CommentsController created');
  }

  @Get(':id')
  async getById(@Param() params: ParamsObjectIdDto): Promise<CommentViewDto> {
    const commentViewDto = await this.commentsQueryRepository.getById(
      params.id,
    );

    if (!commentViewDto) {
      throw new NotFoundException(`comments not found: ${params.id}`);
    }

    return commentViewDto;
  }
}

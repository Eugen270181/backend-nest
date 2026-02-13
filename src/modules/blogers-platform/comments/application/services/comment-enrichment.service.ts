import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';
import { Injectable } from '@nestjs/common';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { LikesCommentsRepository } from '../../../likes/infrastructure/likes-comments.repository';

@Injectable()
export class CommentEnrichmentService {
  constructor(
    private readonly likesCommentsRepository: LikesCommentsRepository,
  ) {}

  async enrich(
    commentViewDto: CommentViewDto,
    userId?: string,
  ): Promise<CommentViewDto> {
    let myStatus = LikeStatus.None;
    if (userId) {
      const myLike =
        await this.likesCommentsRepository.findLikeCommentByAuthorIdAndCommentId(
          userId,
          commentViewDto.id,
        );
      myStatus = myLike?.likeStatus ?? LikeStatus.None;
      commentViewDto.setMyLikeStatus(myStatus);
    }

    return commentViewDto;
  }
}

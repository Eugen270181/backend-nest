import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';

export class LikeCommentDto {
  authorId: string;
  commentId: string;
  likeStatus: LikeStatus;
}

import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';

export class LikeCommentDomainDto {
  authorId: string;
  commentId: string;
  likeStatus: LikeStatus;
}

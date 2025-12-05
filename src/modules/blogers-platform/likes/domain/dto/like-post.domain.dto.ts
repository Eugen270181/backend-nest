import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';

export class LikePostDomainDto {
  authorId: string;
  postId: string;
  likeStatus: LikeStatus;
}

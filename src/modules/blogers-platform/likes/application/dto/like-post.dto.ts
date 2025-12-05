import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';

export class LikePostDto {
  authorId: string;
  postId: string;
  likeStatus: LikeStatus;
}

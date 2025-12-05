import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';
import { IsEnum } from 'class-validator';

export class LikePostInputDto {
  @IsEnum(LikeStatus, {
    message: 'Invalid like status. Valid value: None, Like or Dislike',
  })
  likeStatus: LikeStatus;
}

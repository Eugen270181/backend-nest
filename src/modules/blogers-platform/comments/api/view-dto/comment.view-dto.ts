import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';
import { CommentatorInfo } from '../../domain/commentator-info.schema';
import { CommentDocument } from '../../domain/comment.entity';

// export class CommentatorInfo {
//   userId: string;
//   userLogin: string;
//   static CreateInstance() {
//     //todo  release find atr val in posts query repo //helpers functions with take data from likePostRepository
//     return new this();
//   }
// }

export class LikesInfo {
  likesCount: number = 0;
  dislikesCount: number = 0;
  myStatus: LikeStatus = LikeStatus.None;

  static CreateInstance() {
    //todo  release find atr val in posts query repo //helpers functions with take data from likePostRepository
    return new this();
  }
}
//TODO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
export class CommentViewDto {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
  likesInfo: LikesInfo;

  static mapToView(comment: CommentDocument): CommentViewDto {
    const dto = new CommentViewDto();

    dto.id = comment._id.toString();
    dto.content = comment.content;
    dto.commentatorInfo = comment.commentatorInfo;
    dto.createdAt = comment.createdAt.toISOString();
    dto.likesInfo = LikesInfo.CreateInstance();

    return dto;
  }
}

import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';

export class CommentatorInfo {
  userId: string;
  userLogin: string;
}

export class LikesInfo {
  likesCount: number = 0;
  dislikesCount: number = 0;
  myStatus: LikeStatus = LikeStatus.None;
}

export class CommentViewDto {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
  likesInfo: LikesInfo;

  //маппер принимает строку запроса comments JOIN users (snake_case) с посчитанными лайками
  static mapRowToView(row: any): CommentViewDto {
    const dto = new CommentViewDto();

    dto.id = row.id;
    dto.content = row.content;
    dto.commentatorInfo = { userId: row.user_id, userLogin: row.user_login };
    dto.createdAt = row.created_at.toISOString();

    dto.likesInfo = new LikesInfo();
    dto.likesInfo.likesCount = Number(row.likes_count); //COUNT в pg приходит строкой
    dto.likesInfo.dislikesCount = Number(row.dislikes_count);
    dto.likesInfo.myStatus = row.my_status as LikeStatus;

    return dto;
  }
}

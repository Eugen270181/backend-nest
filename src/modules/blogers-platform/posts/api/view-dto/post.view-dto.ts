import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';

export class LikeDetailView {
  addedAt: string;
  userId: string;
  login: string;
}

export class ExtendedLikesInfo {
  likesCount: number = 0;
  dislikesCount: number = 0;
  myStatus: LikeStatus = LikeStatus.None;
  newestLikes: LikeDetailView[] = [];
}

export class PostViewDto {
  id: string;
  title: string; // max 30
  shortDescription: string; // max 100
  content: string; // max 1000
  blogId: string; // valid
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfo;

  //маппер принимает строку запроса posts JOIN blogs (snake_case) с посчитанными лайками:
  //blog_name = b.name, likes_count/dislikes_count/my_status/newest_likes считает SQL
  static mapRowToView(row: any): PostViewDto {
    const dto = new PostViewDto();

    dto.id = row.id;
    dto.title = row.title;
    dto.shortDescription = row.short_description;
    dto.content = row.content;
    dto.blogId = row.blog_id;
    dto.blogName = row.blog_name;
    dto.createdAt = row.created_at.toISOString();

    const likes = new ExtendedLikesInfo();
    likes.likesCount = Number(row.likes_count); //COUNT в pg приходит строкой
    likes.dislikesCount = Number(row.dislikes_count);
    likes.myStatus = row.my_status as LikeStatus;
    //newest_likes - json-массив (до 3 штук, новые первыми); дату приводим к ISO
    likes.newestLikes = (row.newest_likes ?? []).map((l: any) => ({
      addedAt: new Date(l.addedAt).toISOString(),
      userId: l.userId,
      login: l.login,
    }));
    dto.extendedLikesInfo = likes;

    return dto;
  }
}

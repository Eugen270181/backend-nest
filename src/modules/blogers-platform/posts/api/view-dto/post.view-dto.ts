import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';

export class LikeDetailView {
  addedAt: Date;
  userId: string | null;
  login: string | null;
}

//ЗАГЛУШКА: лайки пока не переведены в SQL, поэтому структура ответа сохраняется,
//а значения всегда дефолтные: 0 лайков, 0 дизлайков, myStatus None, newestLikes [].
//Когда появятся таблицы лайков - здесь будет маппинг из них.
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

  //маппер принимает строку запроса posts JOIN blogs (snake_case);
  //blog_name приходит из b.name AS blog_name
  static mapRowToView(row: any): PostViewDto {
    const dto = new PostViewDto();

    dto.id = row.id;
    dto.title = row.title;
    dto.shortDescription = row.short_description;
    dto.content = row.content;
    dto.blogId = row.blog_id;
    dto.blogName = row.blog_name;
    dto.createdAt = row.created_at.toISOString();

    dto.extendedLikesInfo = new ExtendedLikesInfo();

    return dto;
  }
}

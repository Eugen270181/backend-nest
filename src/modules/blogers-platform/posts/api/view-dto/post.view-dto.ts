import { PostDocument } from '../../domain/post.entity';
import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';

export class LikeDetailViewModel {
  addedAt: string;
  userId: string | null;
  login: string | null;
}

export class ExtendedLikesInfo {
  likesCount: number = 0;
  dislikesCount: number = 0;
  myStatus: LikeStatus = LikeStatus.None;
  newestLikes: LikeDetailViewModel[] = [];

  static CreateInstance() {
    //todo  release find atr val in posts query repo //helpers functions with take data from likePostRepository
    return new this();
  }
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

  static mapToView(post: PostDocument): PostViewDto {
    const dto = new PostViewDto();

    dto.id = post._id.toString();
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.blogId = post.blogId;
    dto.blogName = post.blogName;
    dto.createdAt = post.createdAt.toISOString();

    dto.extendedLikesInfo = ExtendedLikesInfo.CreateInstance();

    return dto;
  }
}

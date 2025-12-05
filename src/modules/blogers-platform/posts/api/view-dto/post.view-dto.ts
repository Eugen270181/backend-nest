import { PostDocument } from '../../domain/post.entity';
import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';
import { CommentDocument } from '../../../comments/domain/comment.entity';
import { LikePostDocument } from '../../../likes/domain/like-post.entity';

export class LikeDetailView {
  addedAt: string;
  userId: string | null;
  login: string | null;
  static mapToView(likePost:LikePostDocument){
    const likeDetailView = new LikeDetailView();

    likeDetailView.addedAt = likePost.createdAt;
    //likeDetailView.userId = likePost.
    //todo with userId and login
    return likeDetailView;
  }
}

export class ExtendedLikesInfo {
  likesCount: number = 0;
  dislikesCount: number = 0;
  myStatus: LikeStatus = LikeStatus.None;
  newestLikes: LikeDetailView[] = [];

  static CreateFromPost(post: PostDocument) {
    //todo  release find atr val in posts query repo //helpers functions with take data from likePostRepository
    const extendedLikesInfo = new ExtendedLikesInfo();

    extendedLikesInfo.likesCount = post.likesCount || 0;
    extendedLikesInfo.dislikesCount = post.dislikesCount || 0;

    return extendedLikesInfo;
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

    dto.extendedLikesInfo = ExtendedLikesInfo.CreateFromPost(post);

    return dto;
  }

  setMyLikeStatus(status: LikeStatus): void {
    this.extendedLikesInfo.myStatus = status;
  }
  setNewestLikes(newestLikes: LikeDetailView[]) {
    this.extendedLikesInfo.newestLikes = newestLikes;
  }
}

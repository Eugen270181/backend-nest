import request from 'supertest';
import { App } from 'supertest/types';
import { fullPathTo } from '../../getFullPath';
import { PostViewDto } from '../../../src/modules/blogers-platform/posts/api/view-dto/post.view-dto';
import { CommentViewDto } from '../../../src/modules/blogers-platform/comments/api/view-dto/comment.view-dto';
import { LikeStatus } from '../../../src/core/dto/enum/like-status.enum';
import { LikeDto } from '../../testingDtosCreator';

export const createPostLike = async (
  server: App,
  accessToken: string,
  postId: string,
  dto: LikeDto,
): Promise<void> => {
  await request(server)
    .put(`${fullPathTo.posts}/${postId}/like-status`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(dto)
    .expect(204);
};

export const createCommentLike = async (
  server: App,
  accessToken: string,
  commentId: string,
  dto: LikeDto,
): Promise<void> => {
  await request(server)
    .put(`${fullPathTo.comments}/${commentId}/like-status`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(dto)
    .expect(204);
};

export const checkPostLikeData = (
  post: PostViewDto,
  expLikes?: number,
  expDislikes?: number,
  expMyStatus?: LikeStatus,
  expArrLikes?: Array<{ userId: string; login: string }>,
): void => {
  // Проверка likesCount
  if (expLikes !== undefined) {
    expect(post.extendedLikesInfo.likesCount).toBe(expLikes);
  }
  // Проверка dislikesCount
  if (expDislikes !== undefined) {
    expect(post.extendedLikesInfo.dislikesCount).toBe(expDislikes);
  }
  // Проверка myStatus
  if (expMyStatus !== undefined) {
    expect(post.extendedLikesInfo.myStatus).toBe(expMyStatus);
  }
  // Проверка массива newestLikes
  if (expArrLikes !== undefined) {
    if (expArrLikes.length === 0) {
      expect(post.extendedLikesInfo.newestLikes).toEqual(expArrLikes);
    } else {
      expect(post.extendedLikesInfo.newestLikes).toEqual(
        expect.arrayContaining([
          {
            addedAt: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z?$/,
            ),
            userId: expect.any(String),
            login: expect.any(String),
          },
        ]),
      );

      const arr3Likes = post.extendedLikesInfo.newestLikes;
      const arr3LikesCount = arr3Likes.length;

      expect(arr3LikesCount).toBe(expArrLikes.length);
      for (let i = 0; i < arr3LikesCount; i++) {
        expect(arr3Likes[i].userId).toBe(expArrLikes[i].userId);
        expect(arr3Likes[i].login).toBe(expArrLikes[i].login);
      }
    }
  }
};

export const checkCommentLikeData = (
  comment: CommentViewDto,
  expLikes?: number,
  expDislikes?: number,
  expMyStatus?: LikeStatus,
): void => {
  // Проверка likesCount
  if (expLikes !== undefined) {
    expect(comment.likesInfo.likesCount).toBe(expLikes);
  }
  // Проверка dislikesCount
  if (expDislikes !== undefined) {
    expect(comment.likesInfo.dislikesCount).toBe(expDislikes);
  }
  // Проверка myStatus
  if (expMyStatus !== undefined) {
    expect(comment.likesInfo.myStatus).toBe(expMyStatus);
  }
};
import request from 'supertest';
import { App } from 'supertest/types';
import { fullPathTo } from '../../getFullPath';
import { CommentDto } from '../../testingDtosCreator';
import { CommentViewDto } from '../../../src/modules/blogers-platform/comments/api/view-dto/comment.view-dto';
import { PaginatedViewDto } from '../../../src/core/dto/base.paginated.view-dto';

export const createPostComment = async (
  server: App,
  accessToken: string,
  postId: string,
  dto: CommentDto,
): Promise<CommentViewDto> => {
  const resp = await request(server)
    .post(`${fullPathTo.posts}/${postId}/comments`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(dto)
    .expect(201);

  return resp.body as CommentViewDto;
};

export const createPostComments = async (
  server: App,
  accessToken: string,
  postId: string,
  dtos: CommentDto[],
): Promise<CommentViewDto[]> => {
  const comments: CommentViewDto[] = [];

  for (let i = 0; i < dtos.length; i++) {
    const comment = await createPostComment(server, accessToken, postId, dtos[i]);
    comments.push(comment);
  }

  return comments;
};

export const getPostComments = async (
  server: App,
  postId: string,
  accessToken?: string,
): Promise<PaginatedViewDto<CommentViewDto[]>> => {
  const req = request(server).get(`${fullPathTo.posts}/${postId}/comments`);

  if (accessToken) {
    req.set('Authorization', `Bearer ${accessToken}`);
  }

  const resp = await req.expect(200);

  return resp.body as PaginatedViewDto<CommentViewDto[]>;
};

export const getPostCommentsQty = async (
  server: App,
  postId: string,
): Promise<number> => (await getPostComments(server, postId)).totalCount;

export const getCommentById = async (
  server: App,
  commentId: string,
  accessToken?: string,
): Promise<CommentViewDto> => {
  const req = request(server).get(`${fullPathTo.comments}/${commentId}`);

  if (accessToken) {
    req.set('Authorization', `Bearer ${accessToken}`);
  }

  const resp = await req.expect(200);

  return resp.body as CommentViewDto;
};
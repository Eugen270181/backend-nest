import {
  BlogPostDto,
  PostDto,
  testingDtosCreator,
} from '../../testingDtosCreator';
import { PostViewDto } from '../../../src/modules/blogers-platform/posts/api/view-dto/post.view-dto';
import { App } from 'supertest/types';
import request from 'supertest';
import { PaginatedViewDto } from '../../../src/core/dto/base.paginated.view-dto';
import { fullPathTo } from '../../getFullPath';
import { appConfig } from '../../../src/core/settings/config';

export const createPost = async (
  server: App,
  dto: PostDto,
): Promise<PostViewDto> => {
  const resp = await request(server)
    .post(fullPathTo.posts)
    .auth(appConfig.SA_LOGIN, appConfig.SA_PASS)
    .send(dto)
    .expect(201);

  return resp.body as PostViewDto;
};

export const createPosts = async (
  server: App,
  dtos: PostDto[],
): Promise<PostViewDto[]> => {
  const posts: PostViewDto[] = [];

  for (let i = 0; i < dtos.length; i++) {
    const post = await createPost(server, dtos[i]);
    posts.push(post);
  }

  return posts;
};

export const createBlogPost = async (
  server: App,
  blogId: string,
  blogPostDto?: BlogPostDto,
): Promise<PostViewDto> => {
  const dto = blogPostDto ?? testingDtosCreator.createBlogPostDto({});

  const resp = await request(server)
    .post(`${fullPathTo.blogs}/${blogId}/posts`)
    .auth(appConfig.SA_LOGIN, appConfig.SA_PASS)
    .send(dto)
    .expect(201);

  return resp.body as PostViewDto;
};

export const getPosts = async (
  server: App,
  accessToken?: string,
): Promise<PaginatedViewDto<PostViewDto>> => {
  const req = request(server).get(fullPathTo.posts);

  if (accessToken) {
    req.set('Authorization', `Bearer ${accessToken}`);
  }

  const resp = await req.expect(200);

  return resp.body as PaginatedViewDto<PostViewDto>;
};

export const getPostsQty = async (server: App): Promise<number> =>
  (await getPosts(server)).totalCount;

export const getPostById = async (
  server: App,
  postId: string,
  accessToken?: string, // ✅ Добавь опциональный параметр
): Promise<PostViewDto> => {
  const req = request(server).get(`${fullPathTo.posts}/${postId}`);

  if (accessToken) {
    req.set('Authorization', `Bearer ${accessToken}`);
  }

  const resp = await req.expect(200);

  return resp.body as PostViewDto;
};

export const getBlogPosts = async (
  server: App,
  blogId: string,
  accessToken?: string,
): Promise<PaginatedViewDto<PostViewDto>> => {
  const req = request(server).get(`${fullPathTo.blogs}/${blogId}/posts`);

  if (accessToken) {
    req.set('Authorization', `Bearer ${accessToken}`);
  }

  const resp = await req.expect(200);

  return resp.body as PaginatedViewDto<PostViewDto>;
};

export const getBlogPostsQty = async (
  server: App,
  blogId: string,
): Promise<number> => (await getBlogPosts(server, blogId)).totalCount;

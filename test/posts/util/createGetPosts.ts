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

export const createPost = async (
  server: App,
  dto: PostDto,
): Promise<PostViewDto> => {
  const resp = await request(server)
    .post(fullPathTo.posts)
    //.auth(ADMIN_LOGIN, ADMIN_PASS)
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
    //todo
    .post(`${fullPathTo.blogs}/${blogId}/posts`)
    //.auth(ADMIN_LOGIN, ADMIN_PASS)
    .send(dto)
    .expect(201);

  return resp.body as PostViewDto;
};

export const getPosts = async (
  server: App,
): Promise<PaginatedViewDto<PostViewDto>> => {
  const resp = await request(server).get(fullPathTo.posts).expect(200);

  return resp.body as PaginatedViewDto<PostViewDto>;
};

export const getPostsQty = async (server: App): Promise<number> =>
  (await getPosts(server)).totalCount;

export const getPostById = async (
  server: App,
  postId: string,
  //acessToken?: string,
): Promise<PostViewDto> => {
  const resp = await request(server).get(`${fullPathTo.posts}/${postId}`);
  //.set('Authorization', acessToken ? `bearer ${acessToken}` : ``);
  expect(200);

  return resp.body as PostViewDto;
};

export const getBlogPosts = async (
  server: App,
  blogId: string,
): Promise<PaginatedViewDto<PostViewDto>> => {
  const resp = await request(server)
    .get(`${fullPathTo.blogs}/${blogId}/posts`)
    .expect(200);

  return resp.body as PaginatedViewDto<PostViewDto>;
};

export const getBlogPostsQty = async (
  server: App,
  blogId: string,
): Promise<number> => (await getBlogPosts(server, blogId)).totalCount;

import { App } from 'supertest/types';
import { Connection } from 'mongoose';
import { DataSource } from 'typeorm';
import { getConnectionToken } from '@nestjs/mongoose';
import { dropDbCollections } from '../dropDbCollections';
import {
  BlogPostDto,
  createString,
  LikeStatus,
  PostDto,
  testingDtosCreator,
  validObjectIdString,
} from '../testingDtosCreator';
import { PostViewDto } from '../../src/modules/blogers-platform/posts/api/view-dto/post.view-dto';
import { BlogViewDto } from '../../src/modules/blogers-platform/blogs/api/view-dto/blog.view-dto';
import { createBlogs } from '../blogs/util/createGetBlogs';
import {
  createBlogPost,
  createPosts,
  getBlogPosts,
  getBlogPostsQty,
  getPostById,
  getPosts,
  getPostsQty,
} from './util/createGetPosts';
import request from 'supertest';
import { fullPathTo } from '../getFullPath';
import { validateErrorsObject } from '../validateErrorsObject';
import { ErrorResponseBody } from '../../src/core/exceptions/error-responce-body.type';
import { UserAccountsConfig } from '../../src/modules/user-accounts/user-accounts.config';
import { AuthCredentials } from '../users/util/createGetUsers';
import { INestApplication } from '@nestjs/common';
import { initTestApp } from '../init-test-app';

describe('<<POSTS>> ENDPOINTS TESTING!!!(e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let dataSource: DataSource;
  let server: App;
  let userAccountsConfig: UserAccountsConfig;
  let creds: AuthCredentials;

  beforeAll(async () => {
    app = await initTestApp(false);
    server = app.getHttpServer();
    connection = app.get<Connection>(getConnectionToken());
    dataSource = app.get(DataSource);
    userAccountsConfig = app.get<UserAccountsConfig>(UserAccountsConfig);
    creds = {
      login: userAccountsConfig.saLogin,
      password: userAccountsConfig.saPass,
    };
    await dropDbCollections(connection, dataSource);
  });

  afterAll((done) => {
    done();
  });

  const noValidBlogPostDto = testingDtosCreator.createBlogPostDto({
    title: createString(31),
    shortDescription: createString(101),
    content: createString(1001),
  });

  let postDtos: PostDto[];
  let blogPostDto: BlogPostDto;
  let blogs: BlogViewDto[];
  let posts: PostViewDto[];

  describe(`POST -> "/sa/blogs/:blogId/posts" (base creation):`, () => {
    it(`STATUS 401: Can't create post with no cred data`, async () => {
      blogs = await createBlogs(server, creds, 2);

      await request(server)
        .post(`${fullPathTo.saBlogs}/${blogs[0].id}/posts`)
        .send(noValidBlogPostDto)
        .expect(401);

      //запрос на получение постов, проверка на ошибочное создание поста в БД
      const postCounter = await getPostsQty(server);
      expect(postCounter).toEqual(0);
    });

    it(`STATUS 400: Can't create post with not valid data; Should return errors if passed body is incorrect;`, async () => {
      const resPost = await request(server)
        .post(`${fullPathTo.saBlogs}/${blogs[0].id}/posts`)
        .auth(creds.login, creds.password)
        .send(noValidBlogPostDto)
        .expect(400);
      const resPostBody: ErrorResponseBody = resPost.body;
      //проверка тела ответа на ошибки валидации входных данных по созданию поста
      const expectedErrorsFields = ['title', 'shortDescription', 'content'];
      validateErrorsObject(resPostBody, expectedErrorsFields);
      const postCounter = await getPostsQty(server);
      expect(postCounter).toEqual(0);
    });

    it('STATUS 201: should create posts', async () => {
      //2 поста первого блога (предвар.создание дтошек)
      postDtos = testingDtosCreator.createPostDtos(2, blogs[0].id);
      posts = await createPosts(server, creds, postDtos);

      for (const index of posts.keys()) {
        expect(posts[index]).toEqual({
          id: expect.any(String),
          ...postDtos[index],
          blogName: blogs[0].name,
          createdAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z?$/,
          ),
          extendedLikesInfo: {
            likesCount: 0,
            dislikesCount: 0,
            myStatus: LikeStatus.None,
            newestLikes: [],
          },
        });
      }
    });
  });

  describe(`POST -> "/sa/blogs/:blogId/posts" (second blog):`, () => {
    it(`POST -> "/blogs/:id/posts": Can't create post with no cred data: STATUS 401;`, async () => {
      //запрос на создание нового поста c невалидными данными
      await request(server)
        .post(`${fullPathTo.saBlogs}/${blogs[1].id}/posts`)
        .send(noValidBlogPostDto)
        .expect(401);

      //запрос на получение постов, проверка на ошибочное создание поста в БД
      const postCounter = await getPostsQty(server);
      expect(postCounter).toEqual(2);
    });

    it(`POST -> "/blogs/:id/posts": Can't create post with not valid data: STATUS 400; Should return errors if passed body is incorrect;`, async () => {
      //запрос на создание нового поста c невалидными данными
      const resPost = await request(server)
        .post(`${fullPathTo.saBlogs}/${blogs[1].id}/posts`)
        .auth(creds.login, creds.password)
        .send(noValidBlogPostDto)
        .expect(400);
      const resPostBody: ErrorResponseBody = resPost.body;
      //проверка тела ответа на ошибки валидации входных данных по созданию поста
      const expectedErrorsFields = ['title', 'shortDescription', 'content'];
      validateErrorsObject(resPostBody, expectedErrorsFields);
      //запрос на получение постов, проверка на ошибочное создание поста в БД
      const postCounter = await getPostsQty(server);
      expect(postCounter).toEqual(2);
    });

    it('STATUS 201: Should create post by blog route', async () => {
      //создание 3 поста новый роут
      blogPostDto = testingDtosCreator.createBlogPostDto({});
      const post3 = await createBlogPost(
        server,
        creds,
        blogs[1].id,
        blogPostDto,
      );
      const postCounter = await getPostsQty(server);
      expect(postCounter).toEqual(3);

      expect(post3).toEqual({
        id: expect.any(String),
        ...blogPostDto,
        blogId: blogs[1].id,
        blogName: blogs[1].name,
        createdAt: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: LikeStatus.None,
          newestLikes: [],
        },
      });

      posts.push(post3);
    });

    it(`STATUS 404: Can't found with id`, async () => {
      await request(server)
        .post(`${fullPathTo.saBlogs}/${validObjectIdString}/posts`)
        .auth(creds.login, creds.password)
        .send(blogPostDto)
        .expect(404);
      //запрос на получение постов, проверка на ошибочное создание поста в БД
      const postCounter = await getPostsQty(server);
      expect(postCounter).toEqual(3);
    });
  });

  describe(`GET -> "/posts":`, () => {
    it(`STATUS 200: Return pagination Object with blogs array keys - items. add.: blog created in prev test`, async () => {
      const foundPosts = await getPosts(server);
      expect(foundPosts).toEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 3,
        items: [...posts].reverse(),
        //items: expect.any(Array)
      });
    });
  });

  describe(`GET -> "/posts/:id":`, () => {
    it(`STATUS 404: Can't found with id.`, async () => {
      await request(server)
        .get(`${fullPathTo.posts}/${validObjectIdString}`)
        .expect(404);
    });

    it(`STATUS 200: getById - Ok`, async () => {
      const foundPostById = await getPostById(server, posts[2].id);

      expect(foundPostById).toEqual(posts[2]);
    });
  });

  describe(`GET -> "/blogs/:id/posts":`, () => {
    it(`STATUS 404;: Can't found with id`, async () => {
      await request(server)
        .get(`${fullPathTo.blogs}/${validObjectIdString}/posts`)
        .expect(404);
    });

    it(`STATUS 200: found blogId posts`, async () => {
      const foundPosts = await getBlogPosts(server, blogs[0].id);
      //console.log(foundPosts)
      expect(foundPosts).toEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 2,
        items: [posts[1], posts[0]],
        //items: expect.any(Array)
      });
    });
  });

  describe(`PUT -> "/sa/blogs/:blogId/posts/:postId":`, () => {
    //blogId в теле больше нет: берётся из url, пост блог не меняет
    const updateDto = testingDtosCreator.createBlogPostDto({});
    const postUrl = (blogId: string, postId: string) =>
      `${fullPathTo.saBlogs}/${blogId}/posts/${postId}`;

    it(`STATUS 401: Can't update with no cred data`, async () => {
      await request(server)
        .put(postUrl(blogs[1].id, posts[2].id))
        .send(updateDto)
        .expect(401);

      const foundPost = await getPostById(server, posts[2].id);
      expect(foundPost).toEqual(posts[2]);
    });

    it(`STATUS 400: Can't update with no valid data`, async () => {
      const resPut = await request(server)
        .put(postUrl(blogs[1].id, posts[2].id))
        .auth(creds.login, creds.password)
        .send(noValidBlogPostDto)
        .expect(400);
      const resPutBody: ErrorResponseBody = resPut.body;
      const expectedErrorsFields = ['title', 'shortDescription', 'content'];
      validateErrorsObject(resPutBody, expectedErrorsFields);

      const foundPost = await getPostById(server, posts[2].id);
      expect(foundPost).toEqual(posts[2]);
    });

    it(`STATUS 404: Can't found post with id`, async () => {
      await request(server)
        .put(postUrl(blogs[1].id, validObjectIdString))
        .auth(creds.login, creds.password)
        .send(updateDto)
        .expect(404);
    });

    it(`STATUS 404: Can't found blog with id`, async () => {
      await request(server)
        .put(postUrl(validObjectIdString, posts[2].id))
        .auth(creds.login, creds.password)
        .send(updateDto)
        .expect(404);
    });

    it(`STATUS 404: post belongs to another blog`, async () => {
      await request(server)
        .put(postUrl(blogs[0].id, posts[2].id))
        .auth(creds.login, creds.password)
        .send(updateDto)
        .expect(404);

      const foundPost = await getPostById(server, posts[2].id);
      expect(foundPost).toEqual(posts[2]);
    });

    it(`STATUS 204: Updated Post; no content`, async () => {
      await request(server)
        .put(postUrl(blogs[1].id, posts[2].id))
        .auth(creds.login, creds.password)
        .send(updateDto)
        .expect(204);

      //пост обновился, а блог остался прежним
      const updatedPost = await getPostById(server, posts[2].id);
      expect(updatedPost).toEqual({ ...posts[2], ...updateDto });
      expect(await getBlogPostsQty(server, blogs[0].id)).toBe(2);
      expect(await getBlogPostsQty(server, blogs[1].id)).toBe(1);
    });
  });

  describe(`DELETE -> "/sa/blogs/:blogId/posts/:postId"`, () => {
    const postUrl = (blogId: string, postId: string) =>
      `${fullPathTo.saBlogs}/${blogId}/posts/${postId}`;

    it(`STATUS 401: No cred data`, async () => {
      await request(server)
        .delete(postUrl(blogs[1].id, posts[2].id))
        .expect(401);
      const postCounter = await getPostsQty(server);
      expect(postCounter).toEqual(3);
    });

    it(`STATUS 404: Can't found with id`, async () => {
      await request(server)
        .delete(postUrl(blogs[1].id, validObjectIdString))
        .auth(creds.login, creds.password)
        .expect(404);
      await request(server)
        .delete(postUrl(validObjectIdString, posts[2].id))
        .auth(creds.login, creds.password)
        .expect(404);
      //пост другого блога
      await request(server)
        .delete(postUrl(blogs[0].id, posts[2].id))
        .auth(creds.login, creds.password)
        .expect(404);
      const postCounter = await getPostsQty(server);
      expect(postCounter).toEqual(3);
    });

    it(`STATUS 204: Delete updated post; no content;`, async () => {
      await request(server)
        .delete(postUrl(blogs[1].id, posts[2].id))
        .auth(creds.login, creds.password)
        .expect(204);
      const postCounter = await getPostsQty(server);
      expect(postCounter).toEqual(2);
    });
  });

  describe(`blogName / soft delete of blog (JOIN with blogs)`, () => {
    it(`blogName in posts follows blog rename`, async () => {
      await request(server)
        .put(`${fullPathTo.saBlogs}/${blogs[0].id}`)
        .auth(creds.login, creds.password)
        .send({
          name: 'renamed',
          description: blogs[0].description,
          websiteUrl: blogs[0].websiteUrl,
        })
        .expect(204);

      const foundPost = await getPostById(server, posts[0].id);
      expect(foundPost.blogName).toBe('renamed');
    });

    it(`posts of deleted blog are hidden everywhere`, async () => {
      await request(server)
        .delete(`${fullPathTo.saBlogs}/${blogs[0].id}`)
        .auth(creds.login, creds.password)
        .expect(204);

      expect(await getPostsQty(server)).toBe(0);
      await request(server)
        .get(`${fullPathTo.posts}/${posts[0].id}`)
        .expect(404);
      await request(server)
        .get(`${fullPathTo.blogs}/${blogs[0].id}/posts`)
        .expect(404);
    });
  });
});

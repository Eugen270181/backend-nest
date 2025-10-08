import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { Connection } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
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
import { createBlogs, getBlogById } from '../blogs/util/createGetBlogs';
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
import { ErrorResponseBody } from '../../src/core/exceptions/filters/error-responce-body.type';

describe('<<POSTS>> ENDPOINTS TESTING!!!(e2e)', () => {
  let app: INestApplication<App>;
  let connection: Connection;
  let server: App;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();

    server = app.getHttpServer();

    connection = moduleFixture.get<Connection>(getConnectionToken());
    await dropDbCollections(connection);
  });

  afterAll((done) => {
    done();
  });

  const noValidBlogPostDto = testingDtosCreator.createBlogPostDto({
    title: createString(31),
    shortDescription: createString(101),
    content: createString(1001),
  });
  const noValidPostDto = { ...noValidBlogPostDto, blogId: '1' };

  let postDtos: PostDto[];
  let blogPostDto: BlogPostDto;
  let blogs: BlogViewDto[];
  let posts: PostViewDto[];

  describe(`POST -> "/posts":`, () => {
    it(`POST -> "/posts": Can't create post with not valid data: STATUS 400; Should return errors if passed body is incorrect;`, async () => {
      //запрос на создание нового поста c невалидными данными
      const resPost = await request(server)
        .post(fullPathTo.posts)
        //  .auth(ADMIN_LOGIN, ADMIN_PASS)
        .send(noValidPostDto)
        .expect(400);
      const resPostBody: ErrorResponseBody = resPost.body;
      //проверка тела ответа на ошибки валидации входных данных по созданию поста
      const expectedErrorsFields = [
        'title',
        'shortDescription',
        'content',
        'blogId',
      ];
      validateErrorsObject(resPostBody, expectedErrorsFields);
      //запрос на получение постов, проверка на ошибочное создание поста в БД
      const postCounter = await getPostsQty(server);
      expect(postCounter).toEqual(0);
    });

    it('STATUS 201: should create user', async () => {
      blogs = await createBlogs(server, 2);
      //2. Создание 2-ух постов(предвар.создание дтошек)
      postDtos = testingDtosCreator.createPostDtos(2, blogs[0].id);
      posts = await createPosts(server, postDtos);

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

  describe(`POST -> "/blogs/:id/posts":`, () => {
    it(`POST -> "/blogs/:id/posts": Can't create post with not valid data: STATUS 400; Should return errors if passed body is incorrect;`, async () => {
      //запрос на создание нового поста c невалидными данными
      const resPost = await request(server)
        .post(`${fullPathTo.blogs}/${blogs[1].id}/posts`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
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
      const post3 = await createBlogPost(server, blogs[1].id, blogPostDto);
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
        .post(`${fullPathTo.blogs}/${validObjectIdString}/posts`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
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

  describe(`PUT -> "/posts/:id":`, () => {
    it(`STATUS 400: Can't update with no valid data`, async () => {
      //запрос на обонвление по неверному/несуществующему id
      const resPut = await request(server)
        .put(`${fullPathTo.posts}/${posts[2].id}`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
        .send(noValidPostDto)
        .expect(400);
      const resPutBody: ErrorResponseBody = resPut.body;
      //проверка тела ответа на ошибки валидации входных данных по созданию поста
      const expectedErrorsFields = [
        'title',
        'shortDescription',
        'content',
        'blogId',
      ];
      validateErrorsObject(resPutBody, expectedErrorsFields);
      //запрос на получение постов, проверка на ошибочное создание поста в БД
      //запрос на получение созданного блога по Id - проверка создания в БД нового блога
      const foundPost = await getPostById(server, posts[2].id);
      expect(foundPost).toEqual(posts[2]);
    });

    it(`STATUS 404: Can't found with id`, async () => {
      //запрос на обонвление по неверному/несуществующему id
      await request(server)
        .put(`${fullPathTo.posts}/${validObjectIdString}`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
        .send(postDtos[1])
        .expect(404);
    });

    it(`STATUS 204: Updated Post; no content`, async () => {
      //запрос на обонвление существующего по id
      await request(server)
        .put(`${fullPathTo.posts}/${posts[2].id}`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
        .send(postDtos[1])
        .expect(204);
      //запрос на получение обновленного поста по Id - проверка операции обновления нового блога в БД
      const updatedPost = await getPostById(server, posts[2].id);
      const expectedPost = {
        ...posts[2],
        ...postDtos[1],
        blogName: posts[1].blogName,
      };
      expect(updatedPost).toEqual(expectedPost);
      //после обновления нового поста нового блога на старый блог - blogId в postDtos - сохранен, blogName - firstBlogName
      //проверяем что количество постов первого блога - стало три, а количество постов во втором блоге - 0
      const firstBlogPostsQty = await getBlogPostsQty(server, blogs[0].id);
      const secondBlogPostsQty = await getBlogPostsQty(server, blogs[1].id);
      expect(firstBlogPostsQty).toBe(3);
      expect(secondBlogPostsQty).toBe(0);
    });
  });

  describe(`DELETE -> "/posts/:id"`, () => {
    it(`STATUS 404: Can't found with id`, async () => {
      //запрос на удаление поста по неверному/несуществующему id
      await request(server)
        .delete(`${fullPathTo.posts}/${validObjectIdString}`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
        .expect(404);
      //запрос на получение постов, проверка на ошибочное удаление поста в БД
      const postCounter = await getPostsQty(server);
      expect(postCounter).toEqual(3);
    });

    it(`STATUS 204: Delete updated blog; no content; used additional methods: GET -> /blogs`, async () => {
      //запрос на удаление существующего поста по id
      await request(server)
        .delete(`${fullPathTo.posts}/${posts[2].id}`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
        .expect(204);
      //запрос на получение постов, проверка на ошибочное удаление поста в БД
      const postCounter = await getPostsQty(server);
      expect(postCounter).toEqual(2);
    });
  });
});

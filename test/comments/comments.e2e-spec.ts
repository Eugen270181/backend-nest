import { NestExpressApplication } from '@nestjs/platform-express';
import { Connection } from 'mongoose';
import { App } from 'supertest/types';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { getConnectionToken } from '@nestjs/mongoose';
import { dropDbCollections } from '../dropDbCollections';
import {
  CommentDto,
  createString,
  LikeStatus,
  testingDtosCreator, TokenDto,
  TokensDto,
  validObjectIdString,
} from '../testingDtosCreator';
import { PostViewDto } from '../../src/modules/blogers-platform/posts/api/view-dto/post.view-dto';
import { CommentViewDto } from '../../src/modules/blogers-platform/comments/api/view-dto/comment.view-dto';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import request from 'supertest';
import { fullPathTo } from '../getFullPath';
import { validateErrorsObject } from '../validateErrorsObject';
import { ErrorResponseBody } from '../../src/core/exceptions/filters/error-responce-body.type';
import { createBlog } from '../blogs/util/createGetBlogs';
import { createPosts } from '../posts/util/createGetPosts';
import {
  createPostComments,
  getCommentById,
  getPostComments,
  getPostCommentsQty,
} from './util/createGetComments';
import { appConfig } from '../../src/core/settings/config';
import { createUsersBySa } from '../users/util/createGetUsers';
import { getArrTokensWithUsersLogin } from '../auth/util/createGetAuth';

describe('<<COMMENTS>> ENDPOINTS TESTING!!!(e2e)', () => {
  let app: NestExpressApplication;
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

  afterAll(async () => {
    await app.close();
  });

  const noValidCommentDto = { content: 'fg' };
  const updateCommentDto = { content: createString(25) };

  let posts: PostViewDto[],
    comments: CommentViewDto[],
    commentDtos: CommentDto[];
  let users: UserViewDto[], tokens: TokenDto[];

  describe(`POST -> "posts/:id/comments":`, () => {
    it(`POST -> "posts/:id/comments": Create new comment: STATUS 201;`, async () => {
      // 0. Создание 2 пользователей суперадмином, их авторизация и получение токенов
      users = await createUsersBySa(server, 2);
      tokens = await getArrTokensWithUsersLogin(server, users);

      // 1. Создание блога
      const blog = await createBlog(server);
      const blogId = blog.id;

      // 2. Создание 2-ух постов(предвар.создание дтошек)
      const postDtos = testingDtosCreator.createPostDtos(2, blogId);
      posts = await createPosts(server, postDtos);

      // 3. Создание валидных 2 комментов от юзера 1 к первому посту(предвар.создание дтошек)
      commentDtos = testingDtosCreator.createCommentDtos(2);
      comments = await createPostComments(
        server,
        tokens[0].accessToken,
        posts[0].id,
        commentDtos,
      );

      // Проверяем замапленые объекты общим шаблоном
      expect(comments).toEqual(
        expect.arrayContaining([
          {
            id: expect.any(String),
            content: expect.any(String),
            commentatorInfo: {
              userId: expect.any(String),
              userLogin: expect.any(String),
            },
            createdAt: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z?$/,
            ),
            likesInfo: expect.objectContaining({
              likesCount: expect.any(Number),
              dislikesCount: expect.any(Number),
              myStatus: expect.stringMatching(/None|Like|Dislike/),
            }),
          },
        ]),
      );

      // Конкретнее
      expect(comments[0]).toEqual({
        id: expect.any(String),
        ...commentDtos[0],
        commentatorInfo: {
          userId: users[0].id,
          userLogin: users[0].login,
        },
        createdAt: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z?$/,
        ),
        likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: LikeStatus.None,
        },
      });

      expect(comments).toHaveLength(2);
    });

    it(`POST -> "posts/:id/comments": Can't create comment without authorization: STATUS 401;`, async () => {
      // Запрос на создание нового коммента без авторизации
      await request(server)
        .post(`${fullPathTo.posts}/${posts[0].id}/comments`)
        .send(commentDtos[0])
        .expect(401);

      // С невалидным токеном
      await request(server)
        .post(`${fullPathTo.posts}/${posts[0].id}/comments`)
        .set('Authorization', `Bearer invalid_token`)
        .send(commentDtos[0])
        .expect(401);
    });

    it(`POST -> "posts/:id/comments": Not valid Data. STATUS 400;`, async () => {
      const resPost = await request(server)
        .post(`${fullPathTo.posts}/${posts[0].id}/comments`)
        .set('Authorization', `Bearer ${tokens[0].accessToken}`)
        .send(noValidCommentDto)
        .expect(400);

      const resPostBody: ErrorResponseBody = resPost.body;
      // Проверка тела ответа на ошибки валидации входных данных
      const expectedErrorsFields = ['content'];
      validateErrorsObject(resPostBody, expectedErrorsFields);
    });

    it(`POST -> "posts/:id/comments": Not found. STATUS 404;`, async () => {
      await request(server)
        .post(`${fullPathTo.posts}/${validObjectIdString}/comments`)
        .set('Authorization', `Bearer ${tokens[0].accessToken}`)
        .send({ content: comments[0].content })
        .expect(404);
    });
  });

  describe(`GET -> "posts/:id/comments":`, () => {
    it(`GET -> "posts/:id/comments": Not found. STATUS 404;`, async () => {
      await request(server)
        .get(`${fullPathTo.posts}/${validObjectIdString}/comments`)
        .expect(404);
    });

    it(`GET -> "posts/:id/comments": Ok. STATUS 200;`, async () => {
      const foundComments = await getPostComments(server, posts[0].id);

      expect(foundComments).toEqual({
        pagesCount: expect.any(Number),
        page: expect.any(Number),
        pageSize: expect.any(Number),
        totalCount: expect.any(Number),
        items: [comments[1], comments[0]],
      });
    });
  });

  describe(`GET -> "comments/:id":`, () => {
    it(`GET -> "comments/:id": Not found. STATUS 404;`, async () => {
      await request(server)
        .get(`${fullPathTo.comments}/${validObjectIdString}`)
        .expect(404);
    });

    it(`GET -> "comments/:id": Ok. STATUS 200;`, async () => {
      const foundCommentById = await getCommentById(server, comments[0].id);

      expect(foundCommentById).toEqual(comments[0]);
    });
  });

  describe(`PUT -> "comments/:id":`, () => {
    it(`PUT -> "comments/:id": Not authorized. STATUS 401;`, async () => {
      await request(server)
        .put(`${fullPathTo.comments}/${comments[0].id}`)
        .send(updateCommentDto)
        .expect(401);
    });

    it(`PUT -> "comments/:id": Not valid data. STATUS 400;`, async () => {
      await request(server)
        .put(`${fullPathTo.comments}/${comments[0].id}`)
        .set('Authorization', `Bearer ${tokens[0].accessToken}`)
        .send(noValidCommentDto)
        .expect(400);
    });

    it(`PUT -> "comments/:id": Not found. STATUS 404;`, async () => {
      await request(server)
        .put(`${fullPathTo.comments}/${validObjectIdString}`)
        .set('Authorization', `Bearer ${tokens[0].accessToken}`)
        .send(commentDtos[0])
        .expect(404);
    });

    it(`PUT -> "comments/:id": Forbidden. STATUS 403;`, async () => {
      await request(server)
        .put(`${fullPathTo.comments}/${comments[0].id}`)
        .set('Authorization', `Bearer ${tokens[1].accessToken}`)
        .send(updateCommentDto)
        .expect(403);
    });

    it(`PUT -> "comments/:id": Ok. STATUS 204;`, async () => {
      await request(server)
        .put(`${fullPathTo.comments}/${comments[0].id}`)
        .set('Authorization', `Bearer ${tokens[0].accessToken}`)
        .send(updateCommentDto)
        .expect(204);

      const expectedComment = { ...comments[0], ...updateCommentDto };
      const updatedComment = await getCommentById(server, comments[0].id);
      expect(updatedComment).toEqual(expectedComment);
    });
  });

  describe(`DELETE -> "comments/:id"`, () => {
    it(`DELETE -> "comments/:id": Not authorized. STATUS 401;`, async () => {
      await request(server)
        .delete(`${fullPathTo.comments}/${comments[0].id}`)
        .send({})
        .expect(401);
    });

    it(`DELETE -> "comments/:id": Not found. STATUS 404;`, async () => {
      await request(server)
        .delete(`${fullPathTo.comments}/${validObjectIdString}`)
        .set('Authorization', `Bearer ${tokens[0].accessToken}`)
        .expect(404);
    });

    it(`DELETE -> "comments/:id": Forbidden. STATUS 403;`, async () => {
      await request(server)
        .delete(`${fullPathTo.comments}/${comments[0].id}`)
        .set('Authorization', `Bearer ${tokens[1].accessToken}`)
        .expect(403);
    });

    it(`DELETE -> "comments/:id": Ok. STATUS 204;`, async () => {
      const commentsQtyBefore = await getPostCommentsQty(server, posts[0].id);
      expect(commentsQtyBefore).toBe(2);

      await request(server)
        .delete(`${fullPathTo.comments}/${comments[0].id}`)
        .set('Authorization', `Bearer ${tokens[0].accessToken}`)
        .expect(204);

      // Проверка удаления из БД через get по айди
      await request(server)
        .get(`${fullPathTo.comments}/${comments[0].id}`)
        .expect(404);

      const commentsQtyAfter = await getPostCommentsQty(server, posts[0].id);
      expect(commentsQtyAfter).toBe(1);
    });
  });
});

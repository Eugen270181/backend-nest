import { Connection } from 'mongoose';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { getConnectionToken } from '@nestjs/mongoose';
import { dropDbCollections } from '../dropDbCollections';
import {
  LikeStatus,
  testingDtosCreator,
  TokenDto,
  validObjectIdString,
} from '../testingDtosCreator';
import { PostViewDto } from '../../src/modules/blogers-platform/posts/api/view-dto/post.view-dto';
import { CommentViewDto } from '../../src/modules/blogers-platform/comments/api/view-dto/comment.view-dto';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import request from 'supertest';
import { fullPathTo } from '../getFullPath';
import { AuthCredentials, createUsersBySa } from '../users/util/createGetUsers';
import { getArrTokensWithUsersLogin } from '../auth/util/createGetAuth';
import { createBlog } from '../blogs/util/createGetBlogs';
import { createPosts, getPostById } from '../posts/util/createGetPosts';
import {
  checkCommentLikeData,
  checkPostLikeData,
  createCommentLike,
  createPostLike,
} from './util/createGetLikes';
import {
  createPostComments,
  getCommentById,
} from '../comments/util/createGetComments';
import { UserAccountsConfig } from '../../src/modules/user-accounts/user-accounts.config';
import { INestApplication } from '@nestjs/common';
import { initTestApp } from '../init-test-app';

describe('<<LIKES>> ENDPOINTS TESTING!!!(e2e)', () => {
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

  afterAll(async () => {
    if (connection) await connection.close(); // закрываем соединение с БД
    await app.close();
  });

  //реакция пользователя прямо из таблицы лайков (None хранится как отсутствие строки)
  const getLikeStatusFromDb = async (
    table: 'post_likes' | 'comment_likes',
    column: 'post_id' | 'comment_id',
    targetId: string,
    userId: string,
  ): Promise<LikeStatus> => {
    const rows: { status: LikeStatus }[] = await dataSource.query(
      `SELECT status FROM ${table} WHERE ${column} = $1 AND user_id = $2`,
      [targetId, userId],
    );
    return rows.length ? rows[0].status : LikeStatus.None;
  };

  const noneLikeDto = { likeStatus: LikeStatus.None };
  const likeDto = { likeStatus: LikeStatus.Like };
  const dislikeDto = { likeStatus: LikeStatus.Dislike };

  let posts: PostViewDto[], comments: CommentViewDto[];
  let users: UserViewDto[], tokens: TokenDto[];

  /////////////////////////////////////POSTS_LIKES////////////////////////////
  describe(`PUT -> "posts/:id/like-status":`, () => {
    it(`PUT -> "posts/:id/like-status": Ok. STATUS 204`, async () => {
      // 0. Создание 4 пользователей суперадмином, их авторизация и получение токенов
      users = await createUsersBySa(server, creds, 4);
      tokens = await getArrTokensWithUsersLogin(server, users);

      // 1. Создание блога
      const blog = await createBlog(server, creds);
      const blogId = blog.id;

      // 2. Создание 2-ух постов (предвар.создание дтошек)
      const postDtos = testingDtosCreator.createPostDtos(2, blogId);
      posts = await createPosts(server, creds, postDtos);

      // 3. Создание валидного лайка юзера 1 к первому посту
      await createPostLike(server, tokens[0].accessToken, posts[0].id, likeDto);

      // 4. Проверка создания через БД лайка поста
      const foundPostLikeInDB = await getLikeStatusFromDb(
        'post_likes',
        'post_id',
        posts[0].id,
        users[0].id,
      );

      expect(foundPostLikeInDB).toBe(LikeStatus.Like);

      // 5. Получить замапленый пост по айди с авториз.данными и без первого пользователя
      const post1WithAuth = await getPostById(
        server,
        posts[0].id,
        tokens[0].accessToken,
      );
      const post1WithoutAuth = await getPostById(server, posts[0].id);

      const likeDetailArr = [{ userId: users[0].id, login: users[0].login }];

      checkPostLikeData(post1WithAuth, 1, 0, LikeStatus.Like, likeDetailArr);
      checkPostLikeData(post1WithoutAuth, 1, 0, LikeStatus.None, likeDetailArr);
    });

    it(`PUT -> "posts/:id/like-status": No Auth. STATUS 401`, async () => {
      // Запрос на создание нового лайка к посту без авторизации
      await request(server)
        .put(`${fullPathTo.posts}/${posts[0].id}/like-status`)
        .send(likeDto)
        .expect(401);

      // С невалидным токеном
      await request(server)
        .put(`${fullPathTo.posts}/${posts[0].id}/like-status`)
        .set('Authorization', `Bearer invalid_token`)
        .send(likeDto)
        .expect(401);
    });

    it(`PUT -> "posts/:id/like-status": Not valid data. STATUS 400`, async () => {
      await request(server)
        .put(`${fullPathTo.posts}/${posts[0].id}/like-status`)
        .set('Authorization', `Bearer ${tokens[0].accessToken}`)
        .send({ likeStatus: 'Abrakadabra' })
        .expect(400);
    });

    it(`PUT -> "posts/:id/like-status": Not found. STATUS 404`, async () => {
      await request(server)
        .put(`${fullPathTo.posts}/${validObjectIdString}/like-status`)
        .set('Authorization', `Bearer ${tokens[0].accessToken}`)
        .send(likeDto)
        .expect(404);
    });
  });

  describe(`LIKE_POSTS_TESTING_SCENARIOS`, () => {
    it(`changeLikePostInDb`, async () => {
      // Меняем лайк на дизлайк
      await createPostLike(
        server,
        tokens[0].accessToken,
        posts[0].id,
        dislikeDto,
      );
      let foundPostLikeInDB = await getLikeStatusFromDb(
        'post_likes',
        'post_id',
        posts[0].id,
        users[0].id,
      );
      expect(foundPostLikeInDB).toBe(LikeStatus.Dislike);

      // Меняем дизлайк на лайк
      await createPostLike(server, tokens[0].accessToken, posts[0].id, likeDto);
      foundPostLikeInDB = await getLikeStatusFromDb(
        'post_likes',
        'post_id',
        posts[0].id,
        users[0].id,
      );
      expect(foundPostLikeInDB).toBe(LikeStatus.Like);

      // Меняем лайк на None
      await createPostLike(
        server,
        tokens[0].accessToken,
        posts[0].id,
        noneLikeDto,
      );
      foundPostLikeInDB = await getLikeStatusFromDb(
        'post_likes',
        'post_id',
        posts[0].id,
        users[0].id,
      );
      expect(foundPostLikeInDB).toBe(LikeStatus.None);

      const post1WithAuth = await getPostById(
        server,
        posts[0].id,
        tokens[0].accessToken,
      );
      checkPostLikeData(post1WithAuth, 0, 0, LikeStatus.None, []);
    });

    it(`checkLikeDislikeCounter`, async () => {
      // пост 1 - 2 лайка 2 дизлайка разных юзеров
      await createPostLike(server, tokens[0].accessToken, posts[0].id, likeDto);
      await createPostLike(server, tokens[1].accessToken, posts[0].id, likeDto);
      await createPostLike(
        server,
        tokens[2].accessToken,
        posts[0].id,
        dislikeDto,
      );
      await createPostLike(
        server,
        tokens[3].accessToken,
        posts[0].id,
        dislikeDto,
      );

      const post1WithAuth = await getPostById(
        server,
        posts[0].id,
        tokens[0].accessToken,
      );

      checkPostLikeData(post1WithAuth, 2, 2, LikeStatus.Like);
    });

    it(`checkWork3LastLikes`, async () => {
      // пост 2 - 4 лайка разных пользователей
      await createPostLike(server, tokens[0].accessToken, posts[1].id, likeDto);
      await createPostLike(server, tokens[1].accessToken, posts[1].id, likeDto);
      await createPostLike(
        server,
        tokens[2].accessToken,
        posts[1].id,
        dislikeDto,
      );
      await createPostLike(server, tokens[3].accessToken, posts[1].id, likeDto);

      const post2WithAuth = await getPostById(
        server,
        posts[1].id,
        tokens[1].accessToken,
      );

      const arrDetail = [
        { userId: users[3].id, login: users[3].login },
        { userId: users[1].id, login: users[1].login },
        { userId: users[0].id, login: users[0].login },
      ];

      checkPostLikeData(post2WithAuth, 3, 1, LikeStatus.Like, arrDetail);
    });
  });

  /////////////////////////////////////COMMENTS_LIKES////////////////////////////
  describe(`PUT -> "comments/:id/like-status":`, () => {
    it(`PUT -> "comments/:id/like-status": Ok. STATUS 204`, async () => {
      // 2. Создание 2-ух комментов к первому посту
      const commentDtos = testingDtosCreator.createCommentDtos(2);
      const postId = posts[0].id;
      comments = await createPostComments(
        server,
        tokens[0].accessToken,
        postId,
        commentDtos,
      );

      // 3. Создание валидного лайка юзера 1 к первому комменту
      await createCommentLike(
        server,
        tokens[0].accessToken,
        comments[0].id,
        likeDto,
      );

      // 4. Проверка создания через БД лайка комментария
      const foundCommentLikeInDB = await getLikeStatusFromDb(
        'comment_likes',
        'comment_id',
        comments[0].id,
        users[0].id,
      );

      expect(foundCommentLikeInDB).toBe(LikeStatus.Like);

      // 5. Получить замапленый коммент по айди с авториз.данными и без первого пользователя
      const comment1WithAuth = await getCommentById(
        server,
        comments[0].id,
        tokens[0].accessToken,
      );
      const comment1WithoutAuth = await getCommentById(server, comments[0].id);

      checkCommentLikeData(comment1WithAuth, 1, 0, LikeStatus.Like);
      checkCommentLikeData(comment1WithoutAuth, 1, 0, LikeStatus.None);
    });

    it(`PUT -> "comments/:id/like-status": No Auth. STATUS 401`, async () => {
      // Запрос на создание нового лайка к комменту без авторизации
      await request(server)
        .put(`${fullPathTo.comments}/${comments[0].id}/like-status`)
        .send(likeDto)
        .expect(401);
    });

    it(`PUT -> "comments/:id/like-status": Not valid data. STATUS 400`, async () => {
      await request(server)
        .put(`${fullPathTo.comments}/${comments[0].id}/like-status`)
        .set('Authorization', `Bearer ${tokens[0].accessToken}`)
        .send({ likeStatus: 'Abrakadabra' })
        .expect(400);
    });

    it(`PUT -> "comments/:id/like-status": Not found. STATUS 404`, async () => {
      await request(server)
        .put(`${fullPathTo.comments}/${validObjectIdString}/like-status`)
        .set('Authorization', `Bearer ${tokens[0].accessToken}`)
        .send(likeDto)
        .expect(404);
    });
  });

  describe(`LIKE_COMMENT_TESTING_SCENARIOS`, () => {
    it(`changeLikeCommentInDb`, async () => {
      // Меняем лайк на дизлайк
      await createCommentLike(
        server,
        tokens[0].accessToken,
        comments[0].id,
        dislikeDto,
      );
      let foundCommentLikeInDB = await getLikeStatusFromDb(
        'comment_likes',
        'comment_id',
        comments[0].id,
        users[0].id,
      );
      expect(foundCommentLikeInDB).toBe(LikeStatus.Dislike);

      // Меняем дизлайк на лайк
      await createCommentLike(
        server,
        tokens[0].accessToken,
        comments[0].id,
        likeDto,
      );
      foundCommentLikeInDB = await getLikeStatusFromDb(
        'comment_likes',
        'comment_id',
        comments[0].id,
        users[0].id,
      );
      expect(foundCommentLikeInDB).toBe(LikeStatus.Like);

      // Меняем лайк на None
      await createCommentLike(
        server,
        tokens[0].accessToken,
        comments[0].id,
        noneLikeDto,
      );
      foundCommentLikeInDB = await getLikeStatusFromDb(
        'comment_likes',
        'comment_id',
        comments[0].id,
        users[0].id,
      );
      expect(foundCommentLikeInDB).toBe(LikeStatus.None);

      const comment1WithAuth = await getCommentById(
        server,
        comments[0].id,
        tokens[0].accessToken,
      );
      checkCommentLikeData(comment1WithAuth, 0, 0, LikeStatus.None);
    });

    it(`checkLikeDislikeCounter`, async () => {
      // коммент 1 - 2 лайка 2 дизлайка разных юзеров
      await createCommentLike(
        server,
        tokens[0].accessToken,
        comments[0].id,
        likeDto,
      );
      await createCommentLike(
        server,
        tokens[1].accessToken,
        comments[0].id,
        likeDto,
      );
      await createCommentLike(
        server,
        tokens[2].accessToken,
        comments[0].id,
        dislikeDto,
      );
      await createCommentLike(
        server,
        tokens[3].accessToken,
        comments[0].id,
        dislikeDto,
      );

      const comment1WithAuth = await getCommentById(
        server,
        comments[0].id,
        tokens[0].accessToken,
      );

      checkCommentLikeData(comment1WithAuth, 2, 2, LikeStatus.Like);
    });
  });
});

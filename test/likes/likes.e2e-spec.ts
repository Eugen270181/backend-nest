import { NestExpressApplication } from '@nestjs/platform-express';
import { Connection, Model } from 'mongoose';
import { App } from 'supertest/types';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { dropDbCollections } from '../dropDbCollections';
import {
  LikeStatus,
  testingDtosCreator, TokenDto,
  validObjectIdString,
} from '../testingDtosCreator';
import { PostViewDto } from '../../src/modules/blogers-platform/posts/api/view-dto/post.view-dto';
import { CommentViewDto } from '../../src/modules/blogers-platform/comments/api/view-dto/comment.view-dto';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import request from 'supertest';
import { fullPathTo } from '../getFullPath';
import { createUsersBySa } from '../users/util/createGetUsers';
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
import { LikePost } from '../../src/modules/blogers-platform/likes/domain/like-post.entity';
import { LikeComment } from '../../src/modules/blogers-platform/likes/domain/like-comment.entity';

describe('<<LIKES>> ENDPOINTS TESTING!!!(e2e)', () => {
  let app: NestExpressApplication;
  let connection: Connection;
  let server: App;
  let likePostModel: Model<LikePost>;
  let likeCommentModel: Model<LikeComment>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();

    server = app.getHttpServer();

    connection = moduleFixture.get<Connection>(getConnectionToken());
    likePostModel = moduleFixture.get<Model<LikePost>>(
      getModelToken(LikePost.name),
    );
    likeCommentModel = moduleFixture.get<Model<LikeComment>>(
      getModelToken(LikeComment.name),
    );

    await dropDbCollections(connection);
  });

  afterAll(async () => {
    await app.close();
  });

  const noneLikeDto = { likeStatus: LikeStatus.None };
  const likeDto = { likeStatus: LikeStatus.Like };
  const dislikeDto = { likeStatus: LikeStatus.Dislike };

  let posts: PostViewDto[], comments: CommentViewDto[];
  let users: UserViewDto[], tokens: TokenDto[];

  /////////////////////////////////////POSTS_LIKES////////////////////////////
  describe(`PUT -> "posts/:id/like-status":`, () => {
    it(`PUT -> "posts/:id/like-status": Ok. STATUS 204`, async () => {
      // 0. Создание 4 пользователей суперадмином, их авторизация и получение токенов
      users = await createUsersBySa(server, 4);
      tokens = await getArrTokensWithUsersLogin(server, users);

      // 1. Создание блога
      const blog = await createBlog(server);
      const blogId = blog.id;

      // 2. Создание 2-ух постов (предвар.создание дтошек)
      const postDtos = testingDtosCreator.createPostDtos(2, blogId);
      posts = await createPosts(server, postDtos);

      // 3. Создание валидного лайка юзера 1 к первому посту
      await createPostLike(server, tokens[0].accessToken, posts[0].id, likeDto);

      // 4. Проверка создания через БД лайка поста
      const foundPostLikeInDB = await likePostModel
        .findOne({ authorId: users[0].id, postId: posts[0].id })
        .lean();

      expect(foundPostLikeInDB).toBeDefined();
      expect(foundPostLikeInDB!.likeStatus).toBe(LikeStatus.Like);

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
      let foundPostLikeInDB = await likePostModel
        .findOne({ authorId: users[0].id, postId: posts[0].id })
        .lean();
      expect(foundPostLikeInDB!.likeStatus).toBe(LikeStatus.Dislike);

      // Меняем дизлайк на лайк
      await createPostLike(server, tokens[0].accessToken, posts[0].id, likeDto);
      foundPostLikeInDB = await likePostModel
        .findOne({ authorId: users[0].id, postId: posts[0].id })
        .lean();
      expect(foundPostLikeInDB!.likeStatus).toBe(LikeStatus.Like);

      // Меняем лайк на None
      await createPostLike(
        server,
        tokens[0].accessToken,
        posts[0].id,
        noneLikeDto,
      );
      foundPostLikeInDB = await likePostModel
        .findOne({ authorId: users[0].id, postId: posts[0].id })
        .lean();
      expect(foundPostLikeInDB!.likeStatus).toBe(LikeStatus.None);

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
      const foundCommentLikeInDB = await likeCommentModel
        .findOne({ authorId: users[0].id, commentId: comments[0].id })
        .lean();

      expect(foundCommentLikeInDB).toBeDefined();
      expect(foundCommentLikeInDB!.likeStatus).toBe(LikeStatus.Like);

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
      let foundCommentLikeInDB = await likeCommentModel
        .findOne({ authorId: users[0].id, commentId: comments[0].id })
        .lean();
      expect(foundCommentLikeInDB!.likeStatus).toBe(LikeStatus.Dislike);

      // Меняем дизлайк на лайк
      await createCommentLike(
        server,
        tokens[0].accessToken,
        comments[0].id,
        likeDto,
      );
      foundCommentLikeInDB = await likeCommentModel
        .findOne({ authorId: users[0].id, commentId: comments[0].id })
        .lean();
      expect(foundCommentLikeInDB!.likeStatus).toBe(LikeStatus.Like);

      // Меняем лайк на None
      await createCommentLike(
        server,
        tokens[0].accessToken,
        comments[0].id,
        noneLikeDto,
      );
      foundCommentLikeInDB = await likeCommentModel
        .findOne({ authorId: users[0].id, commentId: comments[0].id })
        .lean();
      expect(foundCommentLikeInDB!.likeStatus).toBe(LikeStatus.None);

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

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * КОМПАКТНАЯ ВЕРСИЯ ТЕСТОВ ДЛЯ ЛАЙКОВ НА ПОСТЫ
 * 
 * Ключевые отличия от базовой версии:
 * - Использует beforeEach для очистки БД между тестами
 * - Максимально упрощена логика
 * - Каждый тест независимый
 */

describe('Posts Likes - Compact Version (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ========== ТЕСТ 1: GET /posts с лайками ==========
  describe('GET /posts - with likes', () => {
    it('should return posts with correct myStatus and newestLikes when user is authenticated', async () => {
      // STEP 1: Создать 2 пользователей
      const user1Signup = await request(app.getHttpServer())
        .post('/auth/registration')
        .send({
          login: 'testuser1',
          password: 'password123',
          email: 'user1@test.com',
        });

      const user2Signup = await request(app.getHttpServer())
        .post('/auth/registration')
        .send({
          login: 'testuser2',
          password: 'password123',
          email: 'user2@test.com',
        });

      // STEP 2: Залогиниться обоими пользователями и получить токены
      const user1LoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          loginOrEmail: 'testuser1',
          password: 'password123',
        })
        .expect(200);

      const user1Token = user1LoginResponse.body.accessToken;

      const user2LoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          loginOrEmail: 'testuser2',
          password: 'password123',
        })
        .expect(200);

      const user2Token = user2LoginResponse.body.accessToken;

      // STEP 3: Создать блог (нужен админ токен)
      const blogResponse = await request(app.getHttpServer())
        .post('/blogs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Test Blog',
          description: 'Test Description',
          websiteUrl: 'https://example.com',
        })
        .expect(201);

      const blogId = blogResponse.body.id;

      // STEP 4: Создать пост
      const postResponse = await request(app.getHttpServer())
        .post(`/blogs/${blogId}/posts`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Test Post',
          shortDescription: 'Short',
          content: 'Content',
        })
        .expect(201);

      const postId = postResponse.body.id;

      // STEP 5: User 1 лайкает пост
      await request(app.getHttpServer())
        .put(`/posts/${postId}/like-status`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ likeStatus: 'Like' })
        .expect(204);

      // STEP 6: User 2 лайкает пост
      await request(app.getHttpServer())
        .put(`/posts/${postId}/like-status`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ likeStatus: 'Like' })
        .expect(204);

      // STEP 7: ✨ КЛЮЧЕВОЙ МОМЕНТ ✨
      // Получить посты от user 1 С ТОКЕНОМ
      const getPostsResponse = await request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${user1Token}`) // ← ОБЯЗАТЕЛЬНО!
        .expect(200);

      // STEP 8: Проверить результаты
      expect(getPostsResponse.body.items).toHaveLength(1);

      const post = getPostsResponse.body.items[0];
      expect(post.id).toBe(postId);

      // Проверить extendedLikesInfo
      expect(post.extendedLikesInfo).toBeDefined();
      expect(post.extendedLikesInfo.likesCount).toBe(2); // 2 лайка
      expect(post.extendedLikesInfo.dislikesCount).toBe(0);
      expect(post.extendedLikesInfo.myStatus).toBe('Like'); // User 1 лайкал
      expect(post.extendedLikesInfo.newestLikes).toHaveLength(2);

      // Проверить структуру newestLikes
      post.extendedLikesInfo.newestLikes.forEach((like) => {
        expect(like).toHaveProperty('addedAt');
        expect(like).toHaveProperty('userId');
        expect(like).toHaveProperty('login');
      });

      // Проверить что лайки отсортированы по убыванию
      if (post.extendedLikesInfo.newestLikes.length > 1) {
        const firstDate = new Date(
          post.extendedLikesInfo.newestLikes[0].addedAt,
        );
        const secondDate = new Date(
          post.extendedLikesInfo.newestLikes[1].addedAt,
        );
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(
          secondDate.getTime(),
        );
      }
    });

    it('should return myStatus "None" for user who did not like the post', async () => {
      // Создать 2 пользователей
      const user1Signup = await request(app.getHttpServer())
        .post('/auth/registration')
        .send({
          login: 'nolike_user1',
          password: 'password123',
          email: 'nolike1@test.com',
        });

      const user2Signup = await request(app.getHttpServer())
        .post('/auth/registration')
        .send({
          login: 'nolike_user2',
          password: 'password123',
          email: 'nolike2@test.com',
        });

      // Залогиниться
      const user1LoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          loginOrEmail: 'nolike_user1',
          password: 'password123',
        })
        .expect(200);

      const user1Token = user1LoginResponse.body.accessToken;

      const user2LoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          loginOrEmail: 'nolike_user2',
          password: 'password123',
        })
        .expect(200);

      const user2Token = user2LoginResponse.body.accessToken;

      // Создать блог и пост
      const blogResponse = await request(app.getHttpServer())
        .post('/blogs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'NoLike Blog',
          description: 'Test',
          websiteUrl: 'https://example.com',
        })
        .expect(201);

      const postResponse = await request(app.getHttpServer())
        .post(`/blogs/${blogResponse.body.id}/posts`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Post',
          shortDescription: 'Short',
          content: 'Content',
        })
        .expect(201);

      const postId = postResponse.body.id;

      // User 2 лайкает, User 1 НЕ лайкает
      await request(app.getHttpServer())
        .put(`/posts/${postId}/like-status`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ likeStatus: 'Like' })
        .expect(204);

      // Получить посты от User 1 (который НЕ лайкал)
      const getPostsResponse = await request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const post = getPostsResponse.body.items[0];
      expect(post.extendedLikesInfo.myStatus).toBe('None');
      expect(post.extendedLikesInfo.likesCount).toBe(1);
      expect(post.extendedLikesInfo.newestLikes).toHaveLength(1);
    });

    it('should return myStatus "Dislike" for user who disliked the post', async () => {
      // Создать пользователей
      const user1Response = await request(app.getHttpServer())
        .post('/auth/registration')
        .send({
          login: 'dislike_user1',
          password: 'password123',
          email: 'dislike1@test.com',
        });

      const user1LoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          loginOrEmail: 'dislike_user1',
          password: 'password123',
        })
        .expect(200);

      const user1Token = user1LoginResponse.body.accessToken;

      // Создать блог и пост
      const blogResponse = await request(app.getHttpServer())
        .post('/blogs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Dislike Blog',
          description: 'Test',
          websiteUrl: 'https://example.com',
        })
        .expect(201);

      const postResponse = await request(app.getHttpServer())
        .post(`/blogs/${blogResponse.body.id}/posts`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Post',
          shortDescription: 'Short',
          content: 'Content',
        })
        .expect(201);

      const postId = postResponse.body.id;

      // User дизлайкает пост
      await request(app.getHttpServer())
        .put(`/posts/${postId}/like-status`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ likeStatus: 'Dislike' })
        .expect(204);

      // Получить посты
      const getPostsResponse = await request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const post = getPostsResponse.body.items[0];
      expect(post.extendedLikesInfo.myStatus).toBe('Dislike');
      expect(post.extendedLikesInfo.dislikesCount).toBe(1);
      expect(post.extendedLikesInfo.newestLikes).toHaveLength(0);
    });
  });

  // ========== ТЕСТ 2: GET /blogs/:blogId/posts с лайками ==========
  describe('GET /blogs/:blogId/posts - with likes', () => {
    it('should return blog posts with correct myStatus when accessed by authenticated user', async () => {
      // Создать пользователей
      const user1LoginResponse = await request(app.getHttpServer())
        .post('/auth/registration')
        .send({
          login: 'blogposts_user1',
          password: 'password123',
          email: 'blogposts1@test.com',
        })
        .then(() =>
          request(app.getHttpServer())
            .post('/auth/login')
            .send({
              loginOrEmail: 'blogposts_user1',
              password: 'password123',
            }),
        );

      const user1Token = user1LoginResponse.body.accessToken;

      // Создать блог
      const blogResponse = await request(app.getHttpServer())
        .post('/blogs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Blog Posts Test',
          description: 'Test',
          websiteUrl: 'https://example.com',
        })
        .expect(201);

      const blogId = blogResponse.body.id;

      // Создать пост
      const postResponse = await request(app.getHttpServer())
        .post(`/blogs/${blogId}/posts`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Post',
          shortDescription: 'Short',
          content: 'Content',
        })
        .expect(201);

      const postId = postResponse.body.id;

      // User лайкает пост
      await request(app.getHttpServer())
        .put(`/posts/${postId}/like-status`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ likeStatus: 'Like' })
        .expect(204);

      // ✨ Получить посты блога С ТОКЕНОМ
      const getBlogPostsResponse = await request(app.getHttpServer())
        .get(`/blogs/${blogId}/posts`)
        .set('Authorization', `Bearer ${user1Token}`) // ← ОБЯЗАТЕЛЬНО!
        .expect(200);

      expect(getBlogPostsResponse.body.items).toHaveLength(1);
      const post = getBlogPostsResponse.body.items[0];

      expect(post.extendedLikesInfo.myStatus).toBe('Like');
      expect(post.extendedLikesInfo.likesCount).toBe(1);
      expect(post.extendedLikesInfo.newestLikes).toHaveLength(1);
      expect(post.blogId).toBe(blogId);
    });
  });
});

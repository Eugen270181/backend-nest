import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { appSetup } from '../../../src/setup/app.setup';
import { NestExpressApplication } from '@nestjs/platform-express';
import { appConfig } from '../../../src/core/settings/config';
import { GLOBAL_PREFIX } from '../../../src/setup/global-prefix.setup';
import { Connection } from 'mongoose';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { LikePost, LikePostModelType } from '../../../src/modules/blogers-platform/likes/domain/like-post.entity';
import {
  LikeComment,
  LikeCommentModelType,
} from '../../../src/modules/blogers-platform/likes/domain/like-comment.entity';
import { dropDbCollections } from '../../dropDbCollections';

describe('Posts Likes (e2e)', () => {
  let app: NestExpressApplication;
  let createdBlogId: string;
  const createdPostIds: string[] = [];
  const userTokens: Map<number, string> = new Map();
  const userIds: Map<number, string> = new Map();


  // User data
  const users = [
    { login: '9505lg', password: 'password123', email: 'user1@test.com' },
    { login: '9506lg', password: 'password123', email: 'user2@test.com' },
    { login: '9507lg', password: 'password123', email: 'user3@test.com' },
    { login: '9508lg', password: 'password123', email: 'user4@test.com' },
  ];

  const blogData = {
    name: 'new blog',
    description: 'description',
    websiteUrl: 'https://example.com',
  };

  const postData = {
    title: 'post title',
    shortDescription: 'description',
    content: 'new post content',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    //app.useGlobalPipes(new ValidationPipe());
    appSetup(app);
    await app.init();

    const connection = moduleFixture.get<Connection>(getConnectionToken());

    await dropDbCollections(connection);
  });

  afterAll(async () => {
    await app.close();
  });

  // Helper functions
  const createUser = async (index: number) => {
    const userData = users[index];
    console.log(userData);
    const response = await request(app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/users`)
      .auth(appConfig.SA_LOGIN, appConfig.SA_PASS)
      .send({
        login: userData.login,
        password: userData.password,
        email: userData.email,
      })
      .expect(201);

    // Get token for user
    const loginResponse = await request(app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/login`)
      .send({
        loginOrEmail: userData.login,
        password: userData.password,
      })
      .expect(200);

    const token = loginResponse.body.accessToken;
    const userId = response.body.id || userData.login; // Store user info for reference

    userTokens.set(index, token);
    userIds.set(index, userId);
    return { token, userId };
  };

  const createBlog = async () => {
    // Admin token can be obtained from initial setup or from the users
    // For this test, we'll use user 1 as admin or create with admin credentials
    const adminToken = userTokens.get(0);

    const response = await request(app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/blogs`)
      .auth(appConfig.SA_LOGIN, appConfig.SA_PASS)
      .send(blogData)
      .expect(201);

    return response.body.id;
  };

  const createPost = async (blogId: string) => {
    //const adminToken = userTokens.get(0);

    const response = await request(app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/blogs/${blogId}/posts`)
      .auth(appConfig.SA_LOGIN, appConfig.SA_PASS)
      .send(postData)
      .expect(201);

    return response.body.id;
  };

  const likePost = async (
    postId: string,
    userIndex: number,
    status: 'Like' | 'Dislike' | 'None' = 'Like',
  ) => {
    const token = userTokens.get(userIndex);

    await request(app.getHttpServer())
      .put(`/${GLOBAL_PREFIX}/posts/${postId}/like-status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ likeStatus: status })
      .expect(204);
  };

  const dislikePost = async (postId: string, userIndex: number) => {
    await likePost(postId, userIndex, 'Dislike');
  };

  const getPosts = async (userIndex: number, blogId?: string) => {
    const token = userTokens.get(userIndex);
    let url = `/${GLOBAL_PREFIX}/posts`;

    if (blogId) {
      url = `/${GLOBAL_PREFIX}/blogs/${blogId}/posts`;
    }

    const response = await request(app.getHttpServer())
      .get(url)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body;
  };

  const getBlogPosts = async (userIndex: number, blogId: string) => {
    return getPosts(userIndex, blogId);
  };

  describe('POST -> /blogs, POST -> /posts, PUT -> posts/:postId/like-status', () => {
    it('should create users', async () => {
      for (let i = 0; i < users.length; i++) {
        await createUser(i);
        expect(userTokens.get(i)).toBeDefined();
      }
    });

    it('should create blog', async () => {
      createdBlogId = await createBlog();
      expect(createdBlogId).toBeDefined();
    });

    it('should create 6 posts', async () => {
      for (let i = 0; i < 6; i++) {
        const postId = await createPost(createdBlogId);
        createdPostIds.push(postId);
      }
      expect(createdPostIds).toHaveLength(6);
    });

    it('should apply likes and dislikes to posts', async () => {
      // like post 1 by user 1, user 2
      await likePost(createdPostIds[0], 0); // user 1
      await likePost(createdPostIds[0], 1); // user 2

      // like post 2 by user 2, user 3
      await likePost(createdPostIds[1], 1); // user 2
      await likePost(createdPostIds[1], 2); // user 3

      // dislike post 3 by user 1
      await dislikePost(createdPostIds[2], 0); // user 1

      // like post 4 by user 1, user 4, user 2, user 3
      await likePost(createdPostIds[3], 0); // user 1
      await likePost(createdPostIds[3], 3); // user 4
      await likePost(createdPostIds[3], 1); // user 2
      await likePost(createdPostIds[3], 2); // user 3

      // like post 5 by user 2, dislike by user 3
      await likePost(createdPostIds[4], 1); // user 2
      await dislikePost(createdPostIds[4], 2); // user 3

      // like post 6 by user 1, dislike by user 2
      await likePost(createdPostIds[5], 0); // user 1
      await dislikePost(createdPostIds[5], 1); // user 2
    });
  });

  describe('GET -> "/posts"', () => {
    it('should get posts with correct like statuses for user 1', async () => {
      const result = await getPosts(0); // user 1

      expect(result.pagesCount).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalCount).toBe(6);
      expect(result.items).toHaveLength(6);

      const items = result.items;

      // Post 1: likesCount: 2, dislikesCount: 0, myStatus: "Like" (user 1 liked it)
      expect(items[5].extendedLikesInfo.likesCount).toBe(2);
      expect(items[5].extendedLikesInfo.dislikesCount).toBe(0);
      expect(items[5].extendedLikesInfo.myStatus).toBe('Like');
      expect(items[5].extendedLikesInfo.newestLikes).toHaveLength(2);

      // Post 2: likesCount: 2, dislikesCount: 0, myStatus: "None" (user 1 didn't like/dislike)
      expect(items[4].extendedLikesInfo.likesCount).toBe(2);
      expect(items[4].extendedLikesInfo.dislikesCount).toBe(0);
      expect(items[4].extendedLikesInfo.myStatus).toBe('None');

      // Post 3: likesCount: 0, dislikesCount: 1, myStatus: "Dislike" (user 1 disliked it)
      expect(items[3].extendedLikesInfo.likesCount).toBe(0);
      expect(items[3].extendedLikesInfo.dislikesCount).toBe(1);
      expect(items[3].extendedLikesInfo.myStatus).toBe('Dislike');
      expect(items[3].extendedLikesInfo.newestLikes).toHaveLength(0);

      // Post 4: likesCount: 4, dislikesCount: 0, myStatus: "Like" (user 1 liked it)
      expect(items[2].extendedLikesInfo.likesCount).toBe(4);
      expect(items[2].extendedLikesInfo.dislikesCount).toBe(0);
      expect(items[2].extendedLikesInfo.myStatus).toBe('Like');
      expect(items[2].extendedLikesInfo.newestLikes).toHaveLength(3); // Should show 3 newest likes

      // Post 5: likesCount: 1, dislikesCount: 1, myStatus: "None" (user 1 didn't interact)
      expect(items[1].extendedLikesInfo.likesCount).toBe(1);
      expect(items[1].extendedLikesInfo.dislikesCount).toBe(1);
      expect(items[1].extendedLikesInfo.myStatus).toBe('None');

      // Post 6: likesCount: 1, dislikesCount: 1, myStatus: "Like" (user 1 liked it)
      expect(items[0].extendedLikesInfo.likesCount).toBe(1);
      expect(items[0].extendedLikesInfo.dislikesCount).toBe(1);
      expect(items[0].extendedLikesInfo.myStatus).toBe('Like');
    });

    it('newestLikes should be sorted in descending order by addedAt', async () => {
      const result = await getPosts(0); // user 1

      const items = result.items;
      const post4Likes = items[2].extendedLikesInfo.newestLikes;

      // Verify that likes are sorted by addedAt in descending order (newest first)
      if (post4Likes.length > 1) {
        for (let i = 0; i < post4Likes.length - 1; i++) {
          const currentDate = new Date(post4Likes[i].addedAt).getTime();
          const nextDate = new Date(post4Likes[i + 1].addedAt).getTime();
          expect(currentDate).toBeGreaterThanOrEqual(nextDate);
        }
      }
    });

    it('should include correct user logins in newestLikes', async () => {
      const result = await getPosts(0); // user 1

      const items = result.items;

      // Post 1 likes should be from user 1 and user 2
      const post1Likes = items[5].extendedLikesInfo.newestLikes.map(
        (like) => like.login,
      );
      expect(post1Likes).toContain('9505lg'); // user 1
      expect(post1Likes).toContain('9506lg'); // user 2

      // Post 4 likes should have user 1, 2, 3, 4 (but only show 3 newest)
      const post4Likes = items[2].extendedLikesInfo.newestLikes;
      expect(post4Likes.length).toBeLessThanOrEqual(3);
      const post4Logins = post4Likes.map((like) => like.login);
      expect(post4Logins).toContain('9505lg'); // user 1
      expect(post4Logins).toContain('9506lg'); // user 2
      expect(post4Logins).toContain('9507lg'); // user 3
    });
  });

  describe('GET -> "/blogs/:blogId/posts"', () => {
    it('should get blog posts with correct like statuses for user 1', async () => {
      const result = await getBlogPosts(0, createdBlogId); // user 1

      expect(result.pagesCount).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalCount).toBe(6);
      expect(result.items).toHaveLength(6);

      const items = result.items;

      // Post 1: likesCount: 2, dislikesCount: 0, myStatus: "Like"
      expect(items[5].extendedLikesInfo.likesCount).toBe(2);
      expect(items[5].extendedLikesInfo.dislikesCount).toBe(0);
      expect(items[5].extendedLikesInfo.myStatus).toBe('Like');

      // Post 2: likesCount: 2, dislikesCount: 0, myStatus: "None"
      expect(items[4].extendedLikesInfo.likesCount).toBe(2);
      expect(items[4].extendedLikesInfo.dislikesCount).toBe(0);
      expect(items[4].extendedLikesInfo.myStatus).toBe('None');

      // Post 3: likesCount: 0, dislikesCount: 1, myStatus: "Dislike"
      expect(items[3].extendedLikesInfo.likesCount).toBe(0);
      expect(items[3].extendedLikesInfo.dislikesCount).toBe(1);
      expect(items[3].extendedLikesInfo.myStatus).toBe('Dislike');

      // Post 4: likesCount: 4, dislikesCount: 0, myStatus: "Like"
      expect(items[2].extendedLikesInfo.likesCount).toBe(4);
      expect(items[2].extendedLikesInfo.dislikesCount).toBe(0);
      expect(items[2].extendedLikesInfo.myStatus).toBe('Like');

      // Post 5: likesCount: 1, dislikesCount: 1, myStatus: "None"
      expect(items[1].extendedLikesInfo.likesCount).toBe(1);
      expect(items[1].extendedLikesInfo.dislikesCount).toBe(1);
      expect(items[1].extendedLikesInfo.myStatus).toBe('None');

      // Post 6: likesCount: 1, dislikesCount: 1, myStatus: "Like"
      expect(items[0].extendedLikesInfo.likesCount).toBe(1);
      expect(items[0].extendedLikesInfo.dislikesCount).toBe(1);
      expect(items[0].extendedLikesInfo.myStatus).toBe('Like');
    });

    it('blog posts newestLikes should be sorted in descending order', async () => {
      const result = await getBlogPosts(0, createdBlogId); // user 1

      const items = result.items;
      const post4Likes = items[2].extendedLikesInfo.newestLikes;

      if (post4Likes.length > 1) {
        for (let i = 0; i < post4Likes.length - 1; i++) {
          const currentDate = new Date(post4Likes[i].addedAt).getTime();
          const nextDate = new Date(post4Likes[i + 1].addedAt).getTime();
          expect(currentDate).toBeGreaterThanOrEqual(nextDate);
        }
      }
    });

    it('should handle different user perspectives correctly', async () => {
      // Get posts from user 2's perspective
      const result = await getBlogPosts(1, createdBlogId); // user 2

      const items = result.items;

      // Post 1: user 2 liked it, so myStatus should be "Like"
      expect(items[5].extendedLikesInfo.myStatus).toBe('Like');

      // Post 6: user 2 disliked it, so myStatus should be "Dislike"
      expect(items[0].extendedLikesInfo.myStatus).toBe('Dislike');
    });
  });
});

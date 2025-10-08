import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Connection, Types } from 'mongoose';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { getConnectionToken } from '@nestjs/mongoose';
import { dropDbCollections } from '../dropDbCollections';
import {
  BlogDto,
  createString,
  testingDtosCreator,
  validObjectIdString,
} from '../testingDtosCreator';
import { BlogViewDto } from '../../src/modules/blogers-platform/blogs/api/view-dto/blog.view-dto';
import {
  createBlog,
  getBlogById,
  getBlogs,
  getBlogsQty,
} from './util/createGetBlogs';
import { fullPathTo } from '../getFullPath';
import { ErrorResponseBody } from '../../src/core/exceptions/filters/error-responce-body.type';
import {
  OutputErrorsType,
  validateErrorsObject,
} from '../validateErrorsObject';
import { getUsersQty } from '../users/util/createGetUsers';

describe('<<BLOGS>> ENDPOINTS TESTING!!!(e2e)', () => {
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

  const noValidBlogDto = {
    name: createString(16),
    description: createString(501),
    websiteUrl: createString(101),
  };
  let blogDtos: BlogDto[];
  const blogs: BlogViewDto[] = [];

  describe(`POST -> "/blogs":`, () => {
    it('STATUS 400: shouldn`t create blog with no valid data', async () => {
      const resPost = await request(server)
        .post(fullPathTo.blogs)
        .send(noValidBlogDto)
        .expect(400);

      const resPostBody: ErrorResponseBody = resPost.body;
      const expectedErrorsFields = ['name', 'description', 'websiteUrl'];
      validateErrorsObject(resPostBody, expectedErrorsFields);

      const blogCounter = await getBlogsQty(server);
      expect(blogCounter).toEqual(0);
    });

    it('STATUS 201: should create blog', async () => {
      blogDtos = testingDtosCreator.createBlogDtos(2);
      blogs.push(await createBlog(server, blogDtos[0]));

      //проверка соответствия схемы представления ответа по полям модели ответа, и значений полученых
      expect(blogs[0]).toEqual({
        id: expect.any(String),
        ...blogDtos[0],
        createdAt: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z?$/,
        ),
        isMembership: false,
      });
    });
  });

  describe(`GET -> "/blogs":`, () => {
    it(`STATUS 200: Return pagination Object with blogs items array`, async () => {
      //запрос на получение блогов - проверка создания в БД нового блога
      const foundBlogs = await getBlogs(server);
      expect(foundBlogs).toEqual({
        pagesCount: expect.any(Number),
        page: expect.any(Number),
        pageSize: expect.any(Number),
        totalCount: expect.any(Number),
        items: blogs,
      });
    });
  });

  describe(`GET -> "/blogs/:id":`, () => {
    it(`STATUS 404: Can't found with id`, async () => {
      await request(server)
        .get(`${fullPathTo.blogs}/${validObjectIdString}`)
        .expect(404);
    });
  });

  describe(`PUT -> "/blogs/:id"`, () => {
    it(`STATUS 404: Can't found with id. Used additional methods: GET -> /blogs/:id`, async () => {
      //запрос на обонвление блога по неверному/несуществующему id
      await request(server)
        .put(`${fullPathTo.blogs}/${validObjectIdString}`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
        .send(blogDtos[1])
        .expect(404);
      //запрос на получение блога по id, проверка на ошибочное обновление блога в БД
      const foundBlog = await getBlogById(server, blogs[0].id);
      expect(foundBlog).toEqual(blogs[0]);
    });

    it(`STATUS 400: Can't update blog with not valid data; Should return errors if passed body is incorrect;`, async () => {
      //запрос на обонвление существующего блога по id с невалидными данными
      const resPut = await request(server)
        .put(`${fullPathTo.blogs}/${blogs[0].id}`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
        .send(noValidBlogDto)
        .expect(400);
      const resPostBody: ErrorResponseBody = resPut.body;
      const expectedErrorsFields = ['name', 'description', 'websiteUrl'];
      validateErrorsObject(resPostBody, expectedErrorsFields);

      //запрос на получение блога по id, проверка на ошибочное обновление блога в БД
      const foundBlog = await getBlogById(server, blogs[0].id);
      expect(foundBlog).toEqual(blogs[0]);
    });

    it(`STATUS 204: Updated new blog; no content;`, async () => {
      //запрос на обонвление существующего блога по id
      await request(server)
        .put(`${fullPathTo.blogs}/${blogs[0].id}`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
        .send(blogDtos[1])
        .expect(204);
      //запрос на получение обновленного блога по Id - проверка операции обновления нового блога в БД
      const foundBlog = await getBlogById(server, blogs[0].id);
      const updatedBlog = { ...blogs[0], ...blogDtos[1] };
      expect(foundBlog).toEqual(updatedBlog);
    });
  });

  describe(`DELETE -> "/blogs/:id"`, () => {
    it(`STATUS 404: Can't found with id. Used additional methods: GET -> /blogs`, async () => {
      //запрос на удаление блога по неверному/несуществующему id
      await request(server)
        .delete(`${fullPathTo.blogs}/${validObjectIdString}`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
        .expect(404);
      //запрос на получение блогов, проверка на ошибочное удаление блога в БД
      const blogCounter = await getBlogsQty(server);
      expect(blogCounter).toEqual(1);
    });

    it(`STATUS 204: Delete updated blog; no content; used additional methods: GET -> /blogs`, async () => {
      //запрос на удаление существующего блога по id
      await request(server)
        .delete(`${fullPathTo.blogs}/${blogs[0].id}`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
        .expect(204);
      //запрос на получение блогов, проверка на удаление блога в БД
      const blogCounter = await getBlogsQty(server);
      expect(blogCounter).toEqual(0);
    });
  });
});

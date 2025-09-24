import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Connection } from 'mongoose';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { getConnectionToken } from '@nestjs/mongoose';
import { dropDbCollections } from '../dropDbCollections';
import { BlogDto, testingDtosCreator } from '../testingDtosCreator';
import { BlogViewDto } from '../../src/modules/blogers-platform/blogs/api/view-dto/blog.view-dto';
import {
  createBlog,
  getBlogById,
  getBlogs,
  getBlogsQty,
} from './util/createGetBlogs';
import { getFullPath } from '../getFullPath';

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
  const blogsPath = getFullPath(`/blogs`);
  let blogDtos: BlogDto[];
  //let blogDtos: UserDto[];
  const blogs: BlogViewDto[] = [];

  describe(`POST -> "/blogs":`, () => {
    it('should create blog: STATUS 201', async () => {
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
      //на всякий случай проверяем не произошла ли ошибка записи в БД:
      const blogCounter = await getBlogsQty(server);
      expect(blogCounter).toEqual(1);
      //запрос на получение созданного блога по Id - проверка создания в БД нового блога
      const foundBlog = await getBlogById(server, blogs[0].id);
      expect(foundBlog).toEqual(blogs[0]);
    });
  });

  describe(`GET -> "/blogs":`, () => {
    it(`GET -> "/blogs": Return pagination Object with blogs items array. STATUS 200;`, async () => {
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
    it(`GET -> "/blogs/:id": Can't found with id. STATUS 404;`, async () => {
      await request(server).get('/blogs/555').expect(404);
    });
  });

  describe(`PUT -> "/blogs/:id"`, () => {
    it(`PUT -> "/blogs/:id": Can't found with id. STATUS 404; used additional methods: GET -> /blogs/:id`, async () => {
      //запрос на обонвление блога по неверному/несуществующему id
      await request(server)
        .put(`${blogsPath}/555`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
        .send(blogDtos[1])
        .expect(404);
      //запрос на получение блога по id, проверка на ошибочное обновление блога в БД
      const foundBlog = await getBlogById(server, blogs[0].id);
      expect(foundBlog).toEqual(blogs[0]);
    });

    it(`PUT -> "/blogs/:id": Updatete new blog; STATUS 204; no content;`, async () => {
      //запрос на обонвление существующего блога по id
      await request(server)
        .put(`${blogsPath}/${blogs[0].id}`)
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
    it(`DELETE -> "/blogs/:id": Can't found with id. STATUS 404; used additional methods: GET -> /blogs`, async () => {
      //запрос на удаление блога по неверному/несуществующему id
      await request(server)
        .delete(`${blogsPath}/555`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
        .expect(404);
      //запрос на получение блогов, проверка на ошибочное удаление блога в БД
      const blogCounter = await getBlogsQty(server);
      expect(blogCounter).toEqual(1);
    });

    it(`DELETE -> "/blogs/:id": Delete updated blog; STATUS 204; no content; used additional methods: GET -> /blogs`, async () => {
      //запрос на удаление существующего блога по id
      await request(server)
        .delete(`${blogsPath}/${blogs[0].id}`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
        .expect(204);
      //запрос на получение блогов, проверка на удаление блога в БД
      const blogCounter = await getBlogsQty(server);
      expect(blogCounter).toEqual(0);
    });
  });
});

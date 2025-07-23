import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { dropDbCollections } from '../dropDbCollections';
import { testingDtosCreator, UserDto } from '../testingDtosCreator';
import { createUserBySa, getUsersQty } from './util/createGetUsers';
import { PaginatedViewDto } from '../../src/core/dto/base.paginated.view-dto';

describe('<<USERS>> ENDPOINTS TESTING!!!(e2e)', () => {
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

  //const noValidUserDto = { login: '45', email: 'hhh@ghj.ru', password: 'hh' };

  let userDtos: UserDto[];
  //let userDtos: UserDto[];
  const users: UserViewDto[] = [];

  describe(`POST -> "/users":`, () => {
    it('should create user with valid data: STATUS 201', async () => {
      userDtos = testingDtosCreator.createUserDtos(2);
      users.push(await createUserBySa(server, userDtos[0]));

      expect(users[0]).toEqual({
        id: expect.any(String),
        login: userDtos[0].login,
        email: userDtos[0].email,
        createdAt: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z?$/,
        ),
      });
    });
  });

  describe(`GET -> "/users":`, () => {
    it('should get all user: STATUS 200. Return pagination Object with users items array', async () => {
      users.push(await createUserBySa(server, userDtos[1]));

      const resp = await request(server)
        .get('/users')
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
        .expect(200);
      const data = resp.body as PaginatedViewDto<UserViewDto[]>;

      expect(data.totalCount).toEqual(2);

      expect(data).toEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 2,
        items: [users[1], users[0]],
      });
    });
  });

  describe(`DELETE -> "/users":`, () => {
    it('shouldn`t delete user by id if specified user is not exists: STATUS 404', async () => {
      await request(server)
        .delete(`/users/555`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
        .expect(404);
      //на всякий случай проверяем не произошло ли ошибочное удаление в БД:
      const userCounter = await getUsersQty(server);
      expect(userCounter).toEqual(2);
    });

    it('should delete user by id: STATUS 204', async () => {
      await request(server)
        .delete(`/users/${users[1].id}`)
        //.auth(ADMIN_LOGIN, ADMIN_PASS)
        .expect(204);
      //на всякий случай проверяем не произошло ли ошибочное удаление в БД:
      const userCounter = await getUsersQty(server);
      expect(userCounter).toEqual(1);
    });
  });
});

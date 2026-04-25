import request from 'supertest';
import { App } from 'supertest/types';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { dropDbCollections } from '../dropDbCollections';
import {
  AuthCredentials,
  createUserBySa,
  getUsersQty,
} from './util/createGetUsers';
import { PaginatedViewDto } from '../../src/core/dto/base.paginated.view-dto';
import { fullPathTo } from '../getFullPath';
import { validateErrorsObject } from '../validateErrorsObject';
import { ErrorResponseBody } from '../../src/core/exceptions/error-responce-body.type';

import {
  testingDtosCreator,
  UserDto,
  validObjectIdString,
} from '../testingDtosCreator';
import { UserAccountsConfig } from '../../src/modules/user-accounts/user-accounts.config';
import { INestApplication } from '@nestjs/common';
import { initTestApp } from '../init-test-app';

describe('<<USERS>> ENDPOINTS TESTING!!!(e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let server: App;
  let userAccountsConfig: UserAccountsConfig;
  let creds: AuthCredentials;

  let userDtos: UserDto[];
  const users: UserViewDto[] = [];
  const noValidUserDto = { login: '', email: 'hhh', password: 'hh' };

  beforeAll(async () => {
    app = await initTestApp(false);
    server = app.getHttpServer();
    connection = app.get<Connection>(getConnectionToken());
    userAccountsConfig = app.get<UserAccountsConfig>(UserAccountsConfig);
    creds = {
      login: userAccountsConfig.saLogin,
      password: userAccountsConfig.saPass,
    };
    await dropDbCollections(connection);
  });

  afterAll((done) => {
    done();
  });

  describe(`POST -> "/users":`, () => {
    it('STATUS 401: shouldn`t create user without basic admin creds', async () => {
      await request(server)
        .post(fullPathTo.users)
        .send(noValidUserDto)
        .expect(401);

      const userCounter = await getUsersQty(server, creds);
      expect(userCounter).toEqual(0);
    });

    it('STATUS 400: shouldn`t create user with no valid data', async () => {
      const resPost = await request(server)
        .post(fullPathTo.users)
        .auth(creds.login, creds.password)
        .send(noValidUserDto)
        .expect(400);

      const resPostBody: ErrorResponseBody = resPost.body;
      const expectedErrorsFields = ['login', 'email', 'password'];
      validateErrorsObject(resPostBody, expectedErrorsFields);

      const userCounter = await getUsersQty(server, creds);
      expect(userCounter).toEqual(0);
    });

    it('STATUS 201: should create user with valid data', async () => {
      userDtos = testingDtosCreator.createUserDtos(2);
      users.push(await createUserBySa(server, creds, userDtos[0]));
      expect(users[0]).toEqual({
        id: expect.any(String),
        login: userDtos[0].login,
        email: userDtos[0].email,
        createdAt: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z?$/,
        ),
      });
    });

    it('STATUS 400: should not create not unique user', async () => {
      const resPost = await request(server)
        .post(fullPathTo.users)
        .auth(creds.login, creds.password)
        .send(userDtos[0])
        .expect(400);

      const userCounter = await getUsersQty(server, creds);
      expect(userCounter).toEqual(1);
    });
  });

  describe(`GET -> "/users":`, () => {
    it('STATUS 401: shouldn`t get users without basic admin creds', async () => {
      await request(server).get(fullPathTo.users).expect(401);
    });

    it(' STATUS 200: should get all user. Return pagination Object with users items array', async () => {
      users.push(await createUserBySa(server, creds, userDtos[1]));
      const resp = await request(server)
        .get(fullPathTo.users)
        .auth(creds.login, creds.password)
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
    it('STATUS 401: shouldn`t del user without basic admin creds', async () => {
      await request(server)
        .delete(`${fullPathTo.users}/${validObjectIdString}`)
        .expect(401);

      const userCounter = await getUsersQty(server, creds);
      expect(userCounter).toEqual(2);
    });

    it('STATUS 404: shouldn`t delete user by id if specified user is not exists', async () => {
      await request(server)
        .delete(`${fullPathTo.users}/${validObjectIdString}`)
        .auth(creds.login, creds.password)
        .expect(404);

      const userCounter = await getUsersQty(server, creds);
      expect(userCounter).toEqual(2);
    });

    it('STATUS 204: should delete user by id', async () => {
      await request(server)
        .delete(`${fullPathTo.users}/${users[1].id}`)
        .auth(creds.login, creds.password)
        .expect(204);

      const userCounter = await getUsersQty(server, creds);
      expect(userCounter).toEqual(1);
    });
  });
});

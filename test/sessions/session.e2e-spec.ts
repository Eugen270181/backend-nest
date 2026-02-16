import { NestExpressApplication } from '@nestjs/platform-express';
import { Connection } from 'mongoose';
import { App } from 'supertest/types';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import {
  LoginDto,
  passTestsDefault,
  TokensDto,
  UserDto,
} from '../testingDtosCreator';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { getConnectionToken } from '@nestjs/mongoose';
import { dropDbCollections } from '../dropDbCollections';
import {
  getArrTokensWithUserLogins,
  getTokensWithLogin,
  logoutUser,
} from '../auth/util/createGetAuth';
import request from 'supertest';
import { createUsersBySa } from '../users/util/createGetUsers';
import { SessionViewDto } from '../../src/modules/user-accounts/api/view-dto/session-view.dto';
import { fullPathTo } from '../getFullPath';
import { routerPaths } from '../../src/core/settings/paths';

describe('<<SECURITY>> ENDPOINTS TESTING!!!(e2e)', () => {
  let app: NestExpressApplication;
  let connection: Connection;
  let server: App;

  let users: UserViewDto[] = [];
  const loginDto: LoginDto[] = [];
  const arrTokens: TokensDto[] = [];
  let devicesUser1, devicesUser0: SessionViewDto[];
  const password = passTestsDefault;

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
    jest.restoreAllMocks();
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Security Sessions (e2e)', () => {
    describe(`GET -> "/security/devices"`, () => {
      it('STATUS 200. Give one session', async () => {
        let resGetDev1;

        //1. Создание 2 пользователей суперадмином через 2 дтошки автоматом
        users = await createUsersBySa(server, 2);

        //2. Залогинивание 1 пользователя - 1 раз, 2-го - 3 раза с разных устройств
        loginDto[0] = {
          loginOrEmail: users[0].login,
          password,
        };
        loginDto[1] = { loginOrEmail: users[1].login, password };
        arrTokens.push(await getTokensWithLogin(server, loginDto[0]));
        arrTokens.push(
          ...(await getArrTokensWithUserLogins(server, loginDto[1], 3)),
        );

        //3а. Проверка через RT кол-ва сессий первого пользователя( = 1)
        const resGetDev0 = await request(server)
          .get(`${fullPathTo.security}${routerPaths.inSecurity}`)
          .set('Cookie', `refreshToken=${arrTokens[0].refreshToken}`)
          .expect(200);
        devicesUser0 = resGetDev0.body;
        //проверка структуры ответа
        expect(devicesUser0).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              ip: expect.any(String),
              title: expect.any(String),
              lastActiveDate: expect.stringMatching(
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
              ),
              deviceId: expect.any(String),
            }),
          ]),
        );
        expect(devicesUser0).toHaveLength(1);

        //3б. Проверка через RT кол-ва сессий второго пользователя( = 3)
        resGetDev1 = await request(server)
          .get(`${fullPathTo.security}${routerPaths.inSecurity}`)
          .set('Cookie', `refreshToken=${arrTokens[1].refreshToken}`)
          .expect(200);
        devicesUser1 = resGetDev1.body;
        expect(devicesUser1).toHaveLength(3);
        //убираем сессию по RT из БД - arrTokens[3].refreshToken - делаем невалидный
        await logoutUser(server, arrTokens[3].refreshToken);
        //3в. Проверка через RT кол-ва сессий второго пользователя( = 2)
        resGetDev1 = await request(server)
          .get(`${fullPathTo.security}${routerPaths.inSecurity}`)
          .set('Cookie', `refreshToken=${arrTokens[1].refreshToken}`)
          .expect(200);
        expect(resGetDev1.body).toHaveLength(2);
      });

      it(`STATUS 401. Unauthorized with no RT and not Valid RT.`, async () => {
        //без токена
        await request(server)
          .get(`${fullPathTo.security}${routerPaths.inSecurity}`)
          .expect(401);
        //с протухшим в бд сессий пред.тесте - arrTokens[3].refreshToken
        await request(server)
          .get(`${fullPathTo.security}${routerPaths.inSecurity}`)
          .set('Cookie', `refreshToken=${arrTokens[3].refreshToken}`)
          .expect(401);
      });
    });

    describe(`DELETE -> "/security/devices/:deviceId"`, () => {
      it(` STATUS 401. Unauthorized with no RT and not Valid RT.`, async () => {
        //без токена
        await request(server)
          .delete(`${fullPathTo.security}${routerPaths.inSecurity}/1`)
          .expect(401);
        //с протухшим в пред.тесте - arrTokens[3].refreshToken
        await request(server)
          .delete(`${fullPathTo.security}${routerPaths.inSecurity}/1`)
          .set('Cookie', `refreshToken=${arrTokens[3].refreshToken}`)
          .expect(401);
      });

      it(`STATUS 404. Not Found deviceId.`, async () => {
        await request(server)
          .delete(
            `${fullPathTo.security}${routerPaths.inSecurity}/${devicesUser1[2].deviceId}`,
          )
          .set('Cookie', `refreshToken=${arrTokens[2].refreshToken}`)
          .expect(404);
      });

      it(`STATUS 403. Forbidden. `, async () => {
        await request(server)
          .delete(
            `${fullPathTo.security}${routerPaths.inSecurity}/${devicesUser1[1].deviceId}`,
          )
          .set('Cookie', `refreshToken = ${arrTokens[0].refreshToken}`)
          .expect(403);
      });

      it(`STATUS 204. Everything OK.`, async () => {
        //удаляем
        await request(server)
          .delete(
            `${fullPathTo.security}${routerPaths.inSecurity}/${devicesUser1[1].deviceId}`,
          )
          .set('Cookie', `refreshToken = ${arrTokens[1].refreshToken}`)
          .expect(204);

        //добавляем
        arrTokens.push(
          await getTokensWithLogin(server, {
            loginOrEmail: users[1].login,
            password,
          }),
        );
        //3в. Проверка через RT кол-ва сессий второго пользователя( = 2)
        const resGet = await request(server)
          .get(`${fullPathTo.security}${routerPaths.inSecurity}`)
          .set('Cookie', `refreshToken = ${arrTokens[1].refreshToken}`)
          .expect(200);
        expect(resGet.body).toHaveLength(2);
      });
    });

    describe(`DELETE -> "/security/devices"`, () => {
      it(` STATUS 401. Unauthorized with no RT and not Valid RT.`, async () => {
        //без токена
        await request(server)
          .delete(`${fullPathTo.security}${routerPaths.inSecurity}`)
          .expect(401);
        //с протухшим в пред.тесте - arrTokens[3].refreshToken
        await request(server)
          .delete(`${fullPathTo.security}${routerPaths.inSecurity}`)
          .set('Cookie', `refreshToken=${arrTokens[3].refreshToken}`)
          .expect(401);
      });

      it(`STATUS 204. Everything OK.`, async () => {
        const resGet = await request(server)
          .get(`${fullPathTo.security}${routerPaths.inSecurity}`)
          .set('Cookie', `refreshToken=${arrTokens[1].refreshToken}`)
          .expect(200);
        expect(resGet.body).toHaveLength(2);

        await request(server)
          .delete(`${fullPathTo.security}${routerPaths.inSecurity}`)
          .set('Cookie', `refreshToken=${arrTokens[1].refreshToken}`)
          .expect(204);

        //3в. Проверка через RT кол-ва сессий второго пользователя( = 2)
        const resGet2 = await request(server)
          .get(`${fullPathTo.security}${routerPaths.inSecurity}`)
          .set('Cookie', `refreshToken=${arrTokens[1].refreshToken}`)
          .expect(200);
        expect(resGet2.body).toHaveLength(1);

        ///////////////////////////////////////////
        const resGet3 = await request(server)
          .get(`${fullPathTo.security}${routerPaths.inSecurity}`)
          .set('Cookie', `refreshToken=${arrTokens[1].refreshToken}`)
          .expect(200);
        expect(resGet3.body).toHaveLength(1);
      });
    });
  });
});

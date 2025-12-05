import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { Connection } from 'mongoose';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { dropDbCollections } from '../dropDbCollections';

import { fullPathTo } from '../getFullPath';
import {
  ConfirmPassDto,
  passTestsDefault,
  RecoveryPassDto,
  RegistrationDto,
  ResendRegCodeDto,
  testingDtosCreator,
  TokenDto,
  UserDto,
} from '../testingDtosCreator';
import { randomUUID } from 'crypto';
import { routerPaths } from '../../src/core/settings/paths';
import { createUserBySa } from '../users/util/createGetUsers';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createUserByReg,
  getTokenWithLogin,
  recoveryPassByEmail,
} from './util/createGetAuth';
import {
  User,
  UserDocument,
  UserModelType,
} from '../../src/modules/user-accounts/domain/user.entity';
import { EmailService } from '../../src/modules/notifications/email.service';
import { MockCodeHelper } from './util/mock-code.helper';
import { ErrorResponseBody } from '../../src/core/exceptions/filters/error-responce-body.type';
import { validateErrorsObject } from '../validateErrorsObject';
import { CryptoService } from '../../src/modules/user-accounts/application/crypto.service';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('<<AUTH>> ENDPOINTS TESTING!!!(e2e)', () => {
  let app: NestExpressApplication;
  let connection: Connection;
  let server: App;
  let UserModel: UserModelType;
  let mockCodeHelper: MockCodeHelper;
  let cryptoService: CryptoService;

  const allowAllThrottleMockGuard = {
    canActivate: () => true,
  };

  const mockEmailService = {
    sendConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  };
  const users: UserViewDto[] = [];
  let userDtos: UserDto[] = [];
  let token: TokenDto;

  const noValidRegUserDto: RegistrationDto = {
    login: '',
    email: 'hhh',
    password: 'hh',
  };

  const noValidLoginDto = { loginOrEmail: '', password: 'hh' };
  const noUserLoginDto = { loginOrEmail: 'Eugen', password: 'hh' };

  const noValidNewPassDto: ConfirmPassDto = {
    newPassword: 'hh',
    recoveryCode: '',
  };
  const newPassword = passTestsDefault + '0';
  const noValidEmailDto1: ResendRegCodeDto = { email: 'mail.ru' };
  const noValidEmailDto2: RecoveryPassDto = { email: 'hhh@mail.ru' };

  // Заранее создаем коды для переиспользования
  const codes = {
    confirmReg: randomUUID(),
    resendReg: randomUUID(),
    expiredReg: randomUUID(),
    recoveryPass1: randomUUID(),
    recoveryPass2: randomUUID(),
    expiredPass: randomUUID(),
  };

  const dates = {
    expired: new Date('2000-01-01'),
    valid: new Date(Date.now() + 3600000),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue(mockEmailService)
      .overrideProvider(ThrottlerGuard)
      .useValue(allowAllThrottleMockGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();

    server = app.getHttpServer();
    connection = moduleFixture.get<Connection>(getConnectionToken());
    UserModel = moduleFixture.get(getModelToken(User.name));
    cryptoService = moduleFixture.get(CryptoService);
    mockCodeHelper = new MockCodeHelper();
    await dropDbCollections(connection);
  });

  afterAll(async () => {
    mockCodeHelper.restore();
    jest.restoreAllMocks();
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCodeHelper.restore();
  });

  describe(`POST -> "/auth/login":`, () => {
    it('STATUS 400: couldn`t login with no valid data', async () => {
      const resPost = await request(server)
        .post(`${fullPathTo.auth}${routerPaths.login}`)
        .send(noValidLoginDto)
        .expect(400);
    });

    it('STATUS 401: If the password or login or email is wrong', async () => {
      const resPost = await request(server)
        .post(`${fullPathTo.auth}${routerPaths.login}`)
        .send(noUserLoginDto)
        .expect(401);
    });

    it('STATUS 200: valid credential.', async () => {
      userDtos = testingDtosCreator.createUserDtos(3);
      users.push(await createUserBySa(server, userDtos[0]));

      const loginDto = {
        loginOrEmail: userDtos[0].login,
        password: userDtos[0].password,
      };

      token = await getTokenWithLogin(server, loginDto);
      console.log(token);
    });
  });

  describe(`GET -> "/auth/me"`, () => {
    it(`POST -> "/auth/me": No autorized(loginOrEmail or pass is wrong). STATUS 401;`, async () => {
      await request(server)
        .get(`${fullPathTo.auth}${routerPaths.me}`)
        .expect(401);
    });

    it(`GET -> "/auth/me": With valid authorization. STATUS 200 + user data`, async () => {
      const res = await request(server)
        .get(`${fullPathTo.auth}${routerPaths.me}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      //из ответа мы получим userId но как сравнить с id созданого пользователя в монгусе? к сожалению только напрямую из БД
      // const foundUserInDB: UserDocument = (await UserModel.findOne({
      //   login: users[0].login,
      // }).lean()) as UserDocument;
      // const userId = foundUserInDB._id.toString();

      // 3. Проверяем структуру ответа
      expect(res.body).toEqual({
        email: users[0].email,
        login: users[0].login,
        userId: users[0].id,
      });
    });
  });

  describe(`POST -> "/auth/registration"`, () => {
    it('STATUS 400: couldn`t register with no valid data', async () => {
      const resPost = await request(server)
        .post(`${fullPathTo.auth}${routerPaths.registration}`)
        .send(noValidRegUserDto)
        .expect(400);
      //проверка тела ответа на ошибки валидации входных данных по созданию юзера
      const resPostBody: ErrorResponseBody = resPost.body;
      const expectedErrorsFields = ['login', 'email', 'password'];
      validateErrorsObject(resPostBody, expectedErrorsFields);
      // пользователь уже существует
      const resPost2 = await request(server)
        .post(`${fullPathTo.auth}${routerPaths.registration}`)
        .send(userDtos[0])
        .expect(400);

      const resPostBody2: ErrorResponseBody = resPost2.body;
      console.log(resPostBody2);
      //expect(resPostBody2.code).toBe(DomainExceptionCode.NotUnique);
    });

    it('STATUS 204: register ok with valid data', async () => {
      // 🔑 Передаем UserModel в helper
      mockCodeHelper.setMockConfirmationCode(UserModel, codes.confirmReg);
      console.log('Mock set with code:', codes.confirmReg);
      const resPost = await request(server)
        .post(`${fullPathTo.auth}${routerPaths.registration}`)
        .send(userDtos[1])
        .expect(204);

      // Проверяем что код установлен
      const userInDB: UserDocument = (await UserModel.findOne({
        login: userDtos[1].login,
      }).lean()) as UserDocument;

      console.log('User in DB emailConfirmation:', userInDB?.emailConfirmation);
      expect(userInDB?.emailConfirmation?.confirmationCode).toBe(
        codes.confirmReg,
      );
      expect(userInDB?.isConfirmed).toBe(false);
    });
  });

  describe(`POST -> "/auth/registration-email-resending"`, () => {
    it('STATUS 400: couldn`t resend code with bad request', async () => {
      //1. not valid inputDto data
      await request(server)
        .post(`${fullPathTo.auth}${routerPaths.registrationEmailResending}`)
        .send(noValidEmailDto1)
        .expect(400);
      //2. user not found
      await request(server)
        .post(`${fullPathTo.auth}${routerPaths.registrationEmailResending}`)
        .send(noValidEmailDto2)
        .expect(400);
      //3. user is confirmed yet
      await request(server)
        .post(`${fullPathTo.auth}${routerPaths.registrationEmailResending}`)
        .send({ email: userDtos[0].email })
        .expect(400);
    });

    it('STATUS 204: resend ok.', async () => {
      // 🔑 Передаем UserModel в helper
      mockCodeHelper.setMockConfirmationCode(UserModel, codes.resendReg);
      console.log('Mock set with resend code:', codes.resendReg);
      const resPost = await request(server)
        .post(`${fullPathTo.auth}${routerPaths.registrationEmailResending}`)
        .send({ email: userDtos[1].email })
        .expect(204);

      //aditional in DB
      const foundRegUserInDB: UserDocument = (await UserModel.findOne({
        login: userDtos[1].login,
      }).lean()) as UserDocument;
      expect(foundRegUserInDB?.emailConfirmation?.confirmationCode).toBe(
        codes.resendReg,
      );
      //userId = foundRegUserInDB._id.toString();
    });
  });

  describe(`POST -> "/auth/registration-confirmation"`, () => {
    it('STATUS 204: confirm is ok.', async () => {
      const resPost = await request(server)
        .post(`${fullPathTo.auth}${routerPaths.registrationConfirmation}`)
        .send({ code: codes.resendReg })
        .expect(204);
    });

    it('STATUS 400: couldn`t confirm reg with bad request', async () => {
      //1. Not valid code
      await request(server)
        .post(`${fullPathTo.auth}${routerPaths.registrationConfirmation}`)
        .send({})
        .expect(400);
      //2. code not found in DB
      await request(server)
        .post(`${fullPathTo.auth}${routerPaths.registrationConfirmation}`)
        .send(codes.confirmReg)
        .expect(400);
      //3. Already activated code
      await request(server)
        .post(`${fullPathTo.auth}${routerPaths.registrationConfirmation}`)
        .send(codes.resendReg)
        .expect(400);
      //4. expired code
      //тест на протухший емайл код.../создаем пользователя и новый код подтверждения через регистрацию
      mockCodeHelper.setMockConfirmationCode(
        UserModel,
        codes.expiredReg,
        dates.expired,
      ); //мокаем метод установки кода и даты подкидываем протухшую дату кода
      await createUserByReg(server, userDtos[2]); //создаем пользователя3 с протух.кодом регистрации
      //проверяем запросом
      await request(server)
        .post(`${fullPathTo.auth}${routerPaths.registrationConfirmation}`)
        .send({ code: codes.expiredReg }) //expirationDate - has expired
        .expect(400);
    });
  });

  describe(`POST -> "/auth/password-recovery"`, () => {
    it('STATUS 400: couldn`t send code with bad request', async () => {
      //1. not valid inputDto data
      const resPost = await request(server)
        .post(`${fullPathTo.auth}${routerPaths.passwordRecovery}`)
        .send(noValidEmailDto1)
        .expect(400);
      const resPostBody: ErrorResponseBody = resPost.body;
      //проверка тела ответа на ошибки валидации входных данных по созданию юзера
      const expectedErrorsFields = ['email'];
      validateErrorsObject(resPostBody, expectedErrorsFields);
    });

    it('STATUS 204: resend ok.', async () => {
      //1.несуществующий емэйл - возвращаем стаатус все ок, но письма не отправляем
      await request(server)
        .post(`${fullPathTo.auth}${routerPaths.passwordRecovery}`)
        .send(noValidEmailDto2)
        .expect(204);
      // Проверяем, что письмо не отправлено
      expect(mockEmailService.sendConfirmationEmail).not.toHaveBeenCalled();

      //2.существующий емэйл - возвращаем стаатус все ок, письмо отправляем
      mockCodeHelper.setMockConfirmationCode(UserModel, codes.recoveryPass1);
      await request(server)
        .post(`${fullPathTo.auth}${routerPaths.passwordRecovery}`)
        .send({ email: userDtos[0].email })
        .expect(204);
      //aditional in DB
      const foundRegUserInDB: UserDocument = (await UserModel.findOne({
        email: userDtos[0].email,
      }).lean()) as UserDocument;
      expect(foundRegUserInDB?.passConfirmation?.confirmationCode).toBe(
        codes.recoveryPass1,
      );
      // Проверяем, что письмо отправлено - 1 вызов
      expect(mockEmailService.sendConfirmationEmail).toHaveBeenCalledTimes(1);

      //3.существующий емэйл и незареген юзер - возвращаем статус все ок, письмо отправляем
      mockCodeHelper.setMockConfirmationCode(UserModel, codes.recoveryPass2);
      await request(server)
        .post(`${fullPathTo.auth}${routerPaths.passwordRecovery}`)
        .send({ email: userDtos[2].email })
        .expect(204);
      //aditional in DB
      const foundRegUserInDB2: UserDocument = (await UserModel.findOne({
        email: userDtos[2].email,
      }).lean()) as UserDocument;
      expect(foundRegUserInDB2?.passConfirmation?.confirmationCode).toBe(
        codes.recoveryPass2,
      );
      // Проверяем, что письмо отправлено - 1 вызов
      expect(mockEmailService.sendConfirmationEmail).toHaveBeenCalledTimes(2);
    });
  });

  describe(`POST -> "/auth/new-password"`, () => {
    it(`POST -> "/auth/new-password": Not valid Data. STATUS 400;`, async () => {
      //первый кейс - пришла невалидная хрень и по коду и по паролю новому
      const resPost = await request(server)
        .post(`${fullPathTo.auth}${routerPaths.newPassword}`)
        .send(noValidNewPassDto)
        .expect(400);
      const resPostBody: ErrorResponseBody = resPost.body;
      //проверка тела ответа на ошибки валидации входных данных
      const expectedErrorsFields = ['newPassword', 'recoveryCode'];
      validateErrorsObject(resPostBody, expectedErrorsFields);

      //второй кейс - код не найден
      await request(server)
        .post(`${fullPathTo.auth}${routerPaths.newPassword}`)
        .send({ newPassword: passTestsDefault, recoveryCode: randomUUID() })
        .expect(400);

      //третий кейс - код восстановления протух //дополнительный запрос на создание кода и даты протухания - замоканые
      mockCodeHelper.setMockConfirmationCode(
        UserModel,
        codes.recoveryPass2,
        dates.expired,
      );
      await recoveryPassByEmail(server, { email: userDtos[2].email });

      await request(server)
        .post(`${fullPathTo.auth}${routerPaths.newPassword}`)
        .send({
          newPassword: passTestsDefault,
          recoveryCode: codes.recoveryPass2,
        })
        .expect(400);
    });

    it(`POST -> "/auth/new-password": Everything ok. STATUS 204;`, async () => {
      //подтверждение
      await request(server)
        .post(`${fullPathTo.auth}${routerPaths.newPassword}`)
        .send({ newPassword, recoveryCode: codes.recoveryPass1 })
        .expect(204);

      //проверка нового хеша в бд на совместимость с новым паролем
      const foundUserInDB: UserDocument = (await UserModel.findOne({
        login: userDtos[0].login,
      }).lean()) as UserDocument;
      expect(
        await cryptoService.checkHash(newPassword, foundUserInDB?.passwordHash),
      ).toBeTruthy();
    });
  });
});

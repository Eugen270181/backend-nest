import {
  LoginDto,
  passTestsDefault,
  RecoveryPassDto,
  testingDtosCreator,
  TokenDto,
  UserDto,
} from '../../testingDtosCreator';
import { UserViewDto } from '../../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { fullPathTo } from '../../getFullPath';
import { routerPaths } from '../../../src/core/settings/paths';
import { App } from 'supertest/types';

const request = require('supertest');
//import request from 'supertest'

export const getArrTokensWithUsersLogin = async (
  server: App,
  users: UserViewDto[],
): Promise<TokenDto[]> => {
  const arrToken: TokenDto[] = [];

  for (let i = 0; i < users.length; i++) {
    const token = await getTokenWithLogin(server, {
      loginOrEmail: users[i].login,
      password: passTestsDefault,
    });
    arrToken.push(token);
  }

  return arrToken;
};
///////////////////////////////////////////////////////////////////////////////
export const getTokenWithLogin = async (
  server: App,
  loginDto: LoginDto,
): Promise<TokenDto> => {
  const resPost = await request(server)
    .post(`${fullPathTo.auth}${routerPaths.login}`)
    .send(loginDto)
    .expect(200);

  return getTokenInResponseBody(resPost);
};

const getTokenInResponseBody = (resPost: any): TokenDto => {
  // Проверка структуры accessToken в теле ответа
  expect(resPost.body).toEqual({
    accessToken: expect.any(String),
  });
  const AT: string = resPost.body.accessToken;
  // Проверка наличия AT в теле ответа
  expect(AT).toBeDefined();

  return { accessToken: AT };
};

export const createUserByReg = async (server: App, userDto?: UserDto) => {
  const dto: UserDto = userDto ?? testingDtosCreator.createUserDto({});

  await request(server)
    .post(`${fullPathTo.auth}${routerPaths.registration}`)
    .send(dto)
    .expect(204);
};

export const recoveryPassByEmail = async (
  server: App,
  emailDto: RecoveryPassDto,
) => {
  await request(server)
    .post(`${fullPathTo.auth}${routerPaths.passwordRecovery}`)
    .send(emailDto)
    .expect(204);
};

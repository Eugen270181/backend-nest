import {
  LoginDto,
  passTestsDefault,
  RecoveryPassDto,
  testingDtosCreator,
  TokensDto,
  UserDto,
} from '../../testingDtosCreator';
import { UserViewDto } from '../../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { fullPathTo } from '../../getFullPath';
import { routerPaths } from '../../../src/core/settings/paths';
import { App } from 'supertest/types';
import request from 'supertest';

export const getArrTokensWithUsersLogin = async (
  server: App,
  users: UserViewDto[],
): Promise<TokensDto[]> => {
  const arrTokens: TokensDto[] = [];

  for (let i = 0; i < users.length; i++) {
    const tokens = await getTokensWithLogin(server, {
      loginOrEmail: users[i].login,
      password: passTestsDefault,
    });
    arrTokens.push(tokens);
  }

  return arrTokens;
};

export const getArrTokensWithUserLogins = async (
  server: App,
  loginDto: LoginDto,
  count: number,
): Promise<TokensDto[]> => {
  const arrTokens: TokensDto[] = [];

  for (let i = 0; i < count; i++) {
    const tokens = await getTokensWithLogin(server, loginDto);
    arrTokens.push(tokens);
  }

  return arrTokens;
};
///////////////////////////////////////////////////////////////////////////////
export const getTokensWithLogin = async (
  server: App,
  loginDto: LoginDto,
): Promise<TokensDto> => {
  const resPost = await request(server)
    .post(`${fullPathTo.auth}${routerPaths.login}`)
    .send(loginDto)
    .expect(200);

  return getTokensInResponse(resPost);
};

const getTokensInResponse = (resPost: any): TokensDto => {
  // Проверка структуры accessToken в теле ответа
  expect(resPost.body).toEqual({
    accessToken: expect.any(String),
  });
  const accessToken: string = resPost.body.accessToken;
  // Проверка наличия AT в теле ответа
  expect(accessToken).toBeDefined();
  ////////////////////////////////////////////
  const cookies: string[] | undefined = resPost.headers['set-cookie'];
  expect(cookies).toBeDefined();
  const cookieWithRefreshToken: string | undefined = cookies?.find((c) =>
    c.includes('refreshToken'),
  );
  expect(cookieWithRefreshToken).toBeDefined();
  const refreshToken: string | undefined =
    cookieWithRefreshToken?.split(';')[0].split('=')[1] || '';
  expect(refreshToken).toBeDefined();

  return { accessToken, refreshToken };
};

export const getTokensWithRefreshToken = async (
  server: App,
  refreshToken: String,
): Promise<TokensDto> => {
  console.log(refreshToken);
  console.log(`${fullPathTo.auth}${routerPaths.refreshToken}`);
  const resPost = await request(server)
    .post(`${fullPathTo.auth}${routerPaths.refreshToken}`)
    .set('Cookie', `refreshToken=${refreshToken}`)
    .expect(200);

  return getTokensInResponse(resPost);
};

export const logoutUser = async (
  server: App,
  refreshToken: String,
  expectedStatus: Number = 204,
) => {
  await request(server)
    .post(`${fullPathTo.auth}${routerPaths.logout}`)
    .set('Cookie', `refreshToken=${refreshToken}`)
    .expect(expectedStatus);
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

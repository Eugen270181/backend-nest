import { App } from 'supertest/types';
import { testingDtosCreator, UserDto } from '../../testingDtosCreator';
import { UserViewDto } from '../../../src/modules/user-accounts/api/view-dto/user.view-dto';
import request from 'supertest';
import { PaginatedViewDto } from '../../../src/core/dto/base.paginated.view-dto';
import { fullPathTo } from '../../getFullPath';

// Вспомогательный тип для параметров аутентификации
export type AuthCredentials = {
  login: string;
  password: string;
};

export const createUserBySa = async (
  server: App,
  credentials: AuthCredentials,
  userDto?: UserDto,
): Promise<UserViewDto> => {
  const dto = userDto ?? testingDtosCreator.createUserDto({});

  const resp = await request(server)
    .post(fullPathTo.users)
    .auth(credentials.login, credentials.password)
    .send(dto)
    .expect(201);

  return resp.body as UserViewDto;
};

export const createUsersBySa = async (
  server: App,
  credentials: AuthCredentials,
  count: number,
): Promise<UserViewDto[]> => {
  const users: UserViewDto[] = [];
  const userDtos: UserDto[] = testingDtosCreator.createUserDtos(count);

  for (let i = 0; i < count; i++) {
    users.push(await createUserBySa(server, credentials, userDtos[i]));
  }

  return users;
};

export const getUsersQty = async (
  server: App,
  credentials: AuthCredentials,
): Promise<number> => {
  const resp = await request(server)
    .get(fullPathTo.users)
    .auth(credentials.login, credentials.password)
    .expect(200);
  const data = resp.body as PaginatedViewDto<UserViewDto[]>;
  return data.totalCount;
};

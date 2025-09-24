import { App } from 'supertest/types';
import { testingDtosCreator, UserDto } from '../../testingDtosCreator';
import { UserViewDto } from '../../../src/modules/user-accounts/api/view-dto/user.view-dto';
import request from 'supertest';
import { PaginatedViewDto } from '../../../src/core/dto/base.paginated.view-dto';
import { fullPathTo } from '../../getFullPath';

export const createUserBySa = async (
  server: App,
  userDto?: UserDto,
): Promise<UserViewDto> => {
  const dto = userDto ?? testingDtosCreator.createUserDto({});

  const resp = await request(server)
    .post(fullPathTo.users)
    //.auth(ADMIN_LOGIN, ADMIN_PASS)
    .send(dto)
    .expect(201);

  return resp.body as UserViewDto;
};

export const getUsersQty = async (server: App): Promise<number> => {
  const resp = await request(server)
    .get(fullPathTo.users)
    //.auth(ADMIN_LOGIN, ADMIN_PASS)
    .expect(200);
  const data = resp.body as PaginatedViewDto<UserViewDto[]>;
  return data.totalCount;
};

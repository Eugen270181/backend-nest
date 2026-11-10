import { INestApplication } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { SessionsRepository } from '../../src/modules/user-accounts/infrastructure/sessions.repository';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';
import { RefreshTokensCommand } from '../../src/modules/user-accounts/application/usecases/refresh-tokens.usecase';
import { UserAccountsConfig } from '../../src/modules/user-accounts/user-accounts.config';
import { dropDbCollections } from '../dropDbCollections';
import { fullPathTo } from '../getFullPath';
import { initTestApp } from '../init-test-app';
import { testingDtosCreator } from '../testingDtosCreator';
import { createUserBySa } from '../users/util/createGetUsers';
import { getTokensWithLogin } from './util/createGetAuth';

describe('Authentication security regressions (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let sessions: SessionsRepository;
  let users: UsersRepository;
  let config: UserAccountsConfig;
  let userId: string;
  let credentials: { loginOrEmail: string; password: string };

  beforeAll(async () => {
    app = await initTestApp();
    dataSource = app.get(DataSource);
    sessions = app.get(SessionsRepository);
    users = app.get(UsersRepository);
    config = app.get(UserAccountsConfig);
    await dropDbCollections(dataSource);
    const dto = testingDtosCreator.createUserDto({});
    const user = await createUserBySa(
      app.getHttpServer(),
      { login: config.saLogin, password: config.saPass },
      dto,
    );
    userId = user.id;
    credentials = { loginOrEmail: dto.login, password: dto.password };
  });

  afterAll(async () => {
    await app?.close();
  });

  it('accepts exactly one rotation of the same refresh-token version', async () => {
    await getTokensWithLogin(app.getHttpServer(), credentials);
    const [session] = await dataSource.query(
      'SELECT device_id, token_version FROM sessions WHERE user_id = $1',
      [userId],
    );
    const command = new RefreshTokensCommand(
      session.device_id,
      userId,
      session.token_version,
    );
    const bus = app.get(CommandBus);
    const results = await Promise.allSettled([
      bus.execute(command),
      bus.execute(command),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
  });

  it('cannot rotate or recreate a revoked session', async () => {
    const [session] = await dataSource.query(
      'SELECT device_id, token_version FROM sessions WHERE user_id = $1',
      [userId],
    );
    await sessions.deleteUserSessionById(session.device_id, userId);
    await expect(
      app
        .get(CommandBus)
        .execute(
          new RefreshTokensCommand(
            session.device_id,
            userId,
            session.token_version,
          ),
        ),
    ).rejects.toThrow();
    expect(await sessions.findSessionById(session.device_id)).toBeNull();
    expect(
      await sessions.deleteUserSessionById(session.device_id, userId),
    ).toBe(false);
  });

  it('invalidates access and refresh tokens immediately after logout', async () => {
    const server = app.getHttpServer();
    const tokens = await getTokensWithLogin(server, credentials);
    const response = await request(server)
      .post(`${fullPathTo.auth}/logout`)
      .set('Cookie', `refreshToken=${tokens.refreshToken}`)
      .expect(204);
    expect(response.headers['set-cookie'][0]).toContain('refreshToken=;');
    await request(server)
      .get(`${fullPathTo.auth}/me`)
      .auth(tokens.accessToken, { type: 'bearer' })
      .expect(401);
    await request(server)
      .post(`${fullPathTo.auth}/refresh-token`)
      .set('Cookie', `refreshToken=${tokens.refreshToken}`)
      .expect(401);
  });

  it('consumes recovery codes once and revokes sessions only for a valid reset', async () => {
    const server = app.getHttpServer();
    const tokens = await getTokensWithLogin(server, credentials);
    const recoveryCode = randomUUID();
    await dataSource.query(
      `UPDATE users SET pass_confirmation_code = $2,
         pass_expiration_date = now() + interval '1 hour' WHERE id = $1`,
      [userId, recoveryCode],
    );
    const user = (await users.findById(userId))!;
    const results = await Promise.all([
      users.updatePasswordAndRevokeSessions(user, recoveryCode),
      users.updatePasswordAndRevokeSessions(user, recoveryCode),
    ]);
    expect(results.sort()).toEqual([false, true]);
    expect((await users.findById(userId))!.passConfirmation).toBeNull();
    await request(server)
      .get(`${fullPathTo.auth}/me`)
      .auth(tokens.accessToken, { type: 'bearer' })
      .expect(401);
    await request(server)
      .post(`${fullPathTo.auth}/refresh-token`)
      .set('Cookie', `refreshToken=${tokens.refreshToken}`)
      .expect(401);

    const freshTokens = await getTokensWithLogin(server, credentials);
    expect(
      await users.updatePasswordAndRevokeSessions(user, recoveryCode),
    ).toBe(false);
    await request(server)
      .get(`${fullPathTo.auth}/me`)
      .auth(freshTokens.accessToken, { type: 'bearer' })
      .expect(200);
  });

  it('enforces login throttling even when clients spoof forwarded IP headers', async () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      const response = await request(app.getHttpServer())
        .post(`${fullPathTo.auth}/login`)
        .set('X-Forwarded-For', `192.0.2.${attempt + 1}`)
        .send({
          loginOrEmail: credentials.loginOrEmail,
          password: 'wrong-password',
        });
      if (response.status === 429) return;
      expect(response.status).toBe(401);
    }
    throw new Error('Login rate limit was bypassed with forwarded headers.');
  });
});

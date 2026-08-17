import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Session, SessionDocument } from '../domain/session.entity';
import { CoreConfig } from '../../../core/core.config';

@Injectable()
export class SessionsRepository {
  constructor(
    private coreConfig: CoreConfig,
    private readonly dataSource: DataSource,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('SessionsRepository created');
  }

  //строка таблицы (snake_case) -> доменная сущность (camelCase)
  private mapToSession(row: any): Session {
    const session = new Session();

    session.deviceId = row.device_id;
    session.userId = row.user_id;
    session.ip = row.ip;
    session.title = row.title;
    session.tokenVersion = row.token_version;
    session.lastActiveDate = row.last_active_date;
    session.expDate = row.exp_date;

    return session;
  }

  //deviceId известен ещё до INSERT (генерируется приложением), поэтому save() — UPSERT:
  //логин -> INSERT новой сессии, refresh той же сессии -> DO UPDATE
  //(аналог прежнего sessionDocument.save(), который сам решал insert/update)
  async save(session: SessionDocument): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO sessions
         (device_id, user_id, ip, title, token_version, last_active_date, exp_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (device_id) DO UPDATE SET
         ip = EXCLUDED.ip,
         title = EXCLUDED.title,
         token_version = EXCLUDED.token_version,
         last_active_date = EXCLUDED.last_active_date,
         exp_date = EXCLUDED.exp_date`,
      [
        session.deviceId,
        session.userId,
        session.ip,
        session.title,
        session.tokenVersion,
        session.lastActiveDate,
        session.expDate,
      ],
    );
  }

  async findSessionById(deviceId: string): Promise<SessionDocument | null> {
    try {
      const rows = await this.dataSource.query(
        'SELECT * FROM sessions WHERE device_id = $1 LIMIT 1',
        [deviceId],
      );
      return rows.length ? this.mapToSession(rows[0]) : null;
    } catch (e) {
      //22P02 = invalid_text_representation (невалидный uuid) — аналог CastError в Mongo
      if ((e as { code?: string })?.code === '22P02') return null;
      throw e; //обрыв коннекта и пр. → 500
    }
  }

  //передаем также userId чтобы случайно не удалить чужую сессию - подстраховка
  async deleteUserSessionById(
    deviceId: string,
    userId: string,
  ): Promise<boolean> {
    //RETURNING device_id — чтобы узнать количество удалённых строк
    //(замена прежнего result.deletedCount)
    const rows = await this.dataSource.query(
      `DELETE FROM sessions
       WHERE device_id = $1 AND user_id = $2
       RETURNING device_id`,
      [deviceId, userId],
    );
    return rows.length > 0;
  }

  async DeleteUserSessionsExcCur(
    deviceId: string,
    userId: string,
  ): Promise<boolean> {
    const rows = await this.dataSource.query(
      `DELETE FROM sessions
       WHERE user_id = $2 AND device_id <> $1
       RETURNING device_id`,
      [deviceId, userId],
    );
    return rows.length > 0;
  }
}

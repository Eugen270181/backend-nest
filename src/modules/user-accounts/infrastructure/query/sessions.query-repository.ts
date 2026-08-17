import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SessionViewDto } from '../../api/view-dto/session-view.dto';
import { CoreConfig } from '../../../../core/core.config';

@Injectable()
export class SessionsQueryRepository {
  constructor(
    private coreConfig: CoreConfig,
    private readonly dataSource: DataSource,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('SessionsQueryRepository created');
  }

  async getById(deviceId: string): Promise<SessionViewDto | null> {
    try {
      const rows = await this.dataSource.query(
        'SELECT * FROM sessions WHERE device_id = $1 LIMIT 1',
        [deviceId],
      );
      return rows.length ? SessionViewDto.mapRowToView(rows[0]) : null;
    } catch (e) {
      //невалидный uuid -> «не найдено» (аналог CastError в Mongo)
      if ((e as { code?: string })?.code === '22P02') return null;
      throw e;
    }
  }

  async getActiveSessions(userId?: string): Promise<SessionViewDto[]> {
    //активная сессия = refresh-токен ещё не протух (замена $gt: dateNow)
    const conditions: string[] = ['exp_date > now()'];
    const params: unknown[] = [];

    if (userId) {
      params.push(userId);
      conditions.push(`user_id = $${params.length}`);
    }

    const rows = await this.dataSource.query(
      `SELECT * FROM sessions WHERE ${conditions.join(' AND ')}`,
      params,
    );

    return rows.map((row: any) => SessionViewDto.mapRowToView(row));
  }
}

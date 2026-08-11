import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MeViewDto } from '../../api/view-dto/me.view-dto';
import { CoreConfig } from '../../../../core/core.config';

@Injectable()
export class AuthQueryRepository {
  constructor(
    private coreConfig: CoreConfig,
    private readonly dataSource: DataSource,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('AuthQueryRepository created');
  }

  async getMeById(id: string): Promise<MeViewDto | null> {
    try {
      const rows = await this.dataSource.query(
        'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
        [id],
      );
      return rows.length ? MeViewDto.mapRowToView(rows[0]) : null;
    } catch (e) {
      //невалидный uuid -> «не найдено» (аналог CastError в Mongo)
      if ((e as { code?: string })?.code === '22P02') return null;
      throw e;
    }
  }
}

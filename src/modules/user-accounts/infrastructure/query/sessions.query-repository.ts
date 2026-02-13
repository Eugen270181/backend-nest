import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../../domain/session.entity';
import { appConfig } from '../../../../core/settings/config';
import { SessionViewDto } from '../../api/view-dto/session-view.dto';
import { FilterQuery } from 'mongoose';

@Injectable()
export class SessionsQueryRepository {
  constructor(
    @InjectModel(Session.name) private readonly SessionModel: SessionModelType,
  ) {
    if (appConfig.IOC_LOG) console.log('SessionsQueryRepository created');
  }

  private async findById(deviceId: string): Promise<SessionDocument | null> {
    return this.SessionModel.findOne({ deviceId }).catch(() => null);
  }

  async getById(id: string): Promise<SessionViewDto | null> {
    const sessionDocument = await this.findById(id);

    if (!sessionDocument) return null;

    return SessionViewDto.mapToView(sessionDocument);
  }

  private async getSessions(
    filter: FilterQuery<Session>,
  ): Promise<SessionViewDto[]> {
    const sessions: SessionDocument[] =
      await this.SessionModel.find(filter).lean();

    return sessions.map((el: SessionDocument) => SessionViewDto.mapToView(el));
  }

  async getActiveSessions(userId?: string): Promise<SessionViewDto[]> {
    const dateNow = new Date();

    const filter: FilterQuery<Session> = {
      expDate: { $gt: dateNow },
      ...(userId && { userId }),
    };
    return this.getSessions(filter);
  }
}

import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../domain/session.entity';
import { CoreConfig } from '../../../core/core.config';

@Injectable()
export class SessionsRepository {
  //инжектирование модели через DI
  constructor(
    private coreConfig: CoreConfig,
    @InjectModel(Session.name) private readonly SessionModel: SessionModelType,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('SessionsRepository created');
  }

  async save(sessionDocument: SessionDocument) {
    await sessionDocument.save();
  }

  async findSessionById(deviceId: string): Promise<SessionDocument | null> {
    return this.SessionModel.findOne({ deviceId });
  }

  async findSessionByActiveToken(
    deviceId: string,
    lastActiveDate: Date,
  ): Promise<SessionDocument | null> {
    return this.SessionModel.findOne({ deviceId, lastActiveDate });
  }
  //передаем также userId чтобы случайно не удалить чужую сессию - подстраховка
  async deleteUserSessionById(deviceId: string, userId: string) {
    const result = await this.SessionModel.deleteOne({ deviceId, userId });
    return result.deletedCount > 0;
  }

  async DeleteUserSessionsExcCur(deviceId: string, userId: string) {
    const filter = { deviceId: { $ne: deviceId }, userId };
    const result = await this.SessionModel.deleteMany(filter);
    return result.deletedCount > 0;
  }
}

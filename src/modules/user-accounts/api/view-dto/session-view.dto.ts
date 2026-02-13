import { SessionDocument } from '../../domain/session.entity';

export class SessionViewDto {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;

  static mapToView(sessionDocument: SessionDocument): SessionViewDto {
    const dto = new SessionViewDto();

    dto.ip = sessionDocument.ip;
    dto.title = sessionDocument.title;
    dto.lastActiveDate = sessionDocument.lastActiveDate.toISOString();
    dto.deviceId = sessionDocument.deviceId;

    return dto;
  }
}

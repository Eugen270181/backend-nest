import { CreateSessionDomainDto } from './dto/create-session.domain.dto';
import { UpdateSessionDomainDto } from './dto/update-session.domain.dto';

//Доменная сущность без ORM-декораторов: хранение теперь в Postgres (raw SQL),
//всю работу с таблицей sessions делает SessionsRepository
export class Session {
  //PK: uuid генерируется приложением при логине (в отличие от users.id,
  //который выдаёт база) — поэтому deviceId известен ещё до INSERT
  deviceId: string;
  userId: string;
  ip: string;
  title: string;
  tokenVersion: string;
  lastActiveDate: Date;
  expDate: Date;

  static createSessionDocument(sessionDto: CreateSessionDomainDto) {
    const sessionDocument = new this();

    sessionDocument.deviceId = sessionDto.deviceId;
    sessionDocument.userId = sessionDto.userId;
    sessionDocument.ip = sessionDto.ip;
    sessionDocument.title = sessionDto.title;
    sessionDocument.tokenVersion = sessionDto.tokenVersion;
    sessionDocument.lastActiveDate = sessionDto.lastActiveDate;
    sessionDocument.expDate = sessionDto.expDate;

    return sessionDocument as SessionDocument;
  }

  updateSession(updateDto: UpdateSessionDomainDto) {
    this.tokenVersion = updateDto.tokenVersion;
    this.expDate = updateDto.expDate;
    this.lastActiveDate = updateDto.lastActiveDate;
  }
}

//АЛИАС: раньше SessionDocument = HydratedDocument<Session>, теперь это просто Session.
//Благодаря этому use-case'ы и сервисы, импортирующие SessionDocument, не меняются.
export type SessionDocument = Session;

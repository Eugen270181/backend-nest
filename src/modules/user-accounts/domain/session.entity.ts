import { CreateSessionDomainDto } from './dto/create-session.domain.dto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UpdateSessionDomainDto } from './dto/update-session.domain.dto';
import { HydratedDocument, Model } from 'mongoose';

@Schema()
export class Session {
  @Prop({ type: String, required: true })
  deviceId: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  ip: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: Date, required: true })
  lastActiveDate: Date;

  @Prop({ type: Date, required: true })
  expDate: Date;

  static createSessionDocument(sessionDto: CreateSessionDomainDto) {
    const sessionDocument = new this();

    sessionDocument.deviceId = sessionDto.deviceId;
    sessionDocument.userId = sessionDto.userId;
    sessionDocument.ip = sessionDto.ip;
    sessionDocument.title = sessionDto.title;
    sessionDocument.lastActiveDate = sessionDto.lastActiveDate;
    sessionDocument.expDate = sessionDto.expDate;

    return sessionDocument as SessionDocument;
  }
  updateSession(updateDto: UpdateSessionDomainDto) {
    this.expDate = updateDto.expDate;
    this.lastActiveDate = updateDto.lastActiveDate;
  }
}

export const SessionSchema = SchemaFactory.createForClass(Session);

//регистрирует методы сущности в схеме
SessionSchema.loadClass(Session);

//Типизация документа
export type SessionDocument = HydratedDocument<Session>;

//Типизация модели + статические методы
export type SessionModelType = Model<SessionDocument> & typeof Session;

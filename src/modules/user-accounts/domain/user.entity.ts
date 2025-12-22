import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import {
  EmailConfirmation,
  EmailConfirmationSchema,
} from './email-confirmation.schema';
import {
  PassConfirmation,
  PassConfirmationSchema,
} from './pass-confirmation.schema';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { UserConfirmCodeDto } from '../../../core/dto/type/user-confirm-code.dto';

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, min: 3, max: 10 })
  login: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  passwordHash: string;

  @Prop({ type: Boolean, required: true, default: false })
  isConfirmed: boolean;

  @Prop({ type: EmailConfirmationSchema, nullable: true, default: null })
  emailConfirmation: EmailConfirmation | null;

  @Prop({ type: PassConfirmationSchema, nullable: true, default: null })
  passConfirmation: PassConfirmation | null;

  createdAt: Date;
  updatedAt: Date;

  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const userDocument = new this();

    userDocument.login = dto.login;
    userDocument.email = dto.email;
    userDocument.passwordHash = dto.passwordHash;

    return userDocument as UserDocument;
  }

  updatePassHash(passwordHash: string) {
    this.passwordHash = passwordHash;
  }

  setUserConfirmation() {
    this.isConfirmed = true;
  }

  setRegConfirmationCode(dto: UserConfirmCodeDto) {
    this.emailConfirmation = dto;
  }

  setPassConfirmationCode(dto: UserConfirmCodeDto) {
    this.passConfirmation = dto;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

//регистрирует методы сущности в схеме
UserSchema.loadClass(User);

//Типизация документа
export type UserDocument = HydratedDocument<User>;

//Типизация модели + статические методы
export type UserModelType = Model<UserDocument> & typeof User;

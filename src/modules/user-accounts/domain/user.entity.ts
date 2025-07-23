import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreateUserBySaDomainDto } from './dto/create-user-by-sa.domain.dto';
import { HydratedDocument, Model } from 'mongoose';
import {
  EmailConfirmation,
  EmailConfirmationSchema,
} from './email-confirmation.schema';
import {
  PassConfirmation,
  PassConfirmationSchema,
} from './pass-confirmation.schema';
import { CreateUserByRegDomainDto } from './dto/create-user-by-reg.domain.dto';

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, min: 3, max: 10 })
  login: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  passwordHash: string;

  @Prop({ type: Boolean, required: true, default: true })
  isConfirmed: boolean;

  @Prop({ type: EmailConfirmationSchema, nullable: true, default: null })
  emailConfirmation: EmailConfirmation | null;

  @Prop({ type: PassConfirmationSchema, nullable: true, default: null })
  passConfirmation: PassConfirmation | null;

  createdAt: Date;
  updatedAt: Date;

  static createUserBySa(dto: CreateUserBySaDomainDto): UserDocument {
    const userDocument = new this();

    userDocument.login = dto.login;
    userDocument.email = dto.email;
    userDocument.passwordHash = dto.passwordHash;

    return userDocument as UserDocument;
  }

  static createUserByReg(dto: CreateUserByRegDomainDto) {
    const userDocument = this.createUserBySa(dto as CreateUserBySaDomainDto);
    //TODO remove to BLL auth - registration
    //const date = dateServices.genAddDate(new Date(), appConfig.EMAIL_TIME);
    //const code = codeServices.genRandomCode();

    userDocument.setRegConfirmationCode(dto.code, dto.date);
    userDocument.isConfirmed = false;

    return userDocument;
  }

  activateConfirmation() {
    this.isConfirmed = true;
  }

  updatePassHash(passwordHash: string) {
    this.passwordHash = passwordHash;
  }

  setRegConfirmationCode(code: string, date: Date) {
    this.emailConfirmation = {
      confirmationCode: code,
      expirationDate: date,
    };
  }

  setPassConfirmationCode(code: string, date: Date) {
    this.passConfirmation = {
      confirmationCode: code,
      expirationDate: date,
    };
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

//регистрирует методы сущности в схеме
UserSchema.loadClass(User);

//Типизация документа
export type UserDocument = HydratedDocument<User>;

//Типизация модели + статические методы
export type UserModelType = Model<UserDocument> & typeof User;

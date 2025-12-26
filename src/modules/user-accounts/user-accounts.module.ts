import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './api/users.controller';
import { AuthController } from './api/auth.controller';
import { User, UserSchema } from './domain/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { UsersQueryService } from './application/query/users.query-service';
import { JwtModule } from '@nestjs/jwt';
import { CryptoService } from './application/services/crypto.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthQueryRepository } from './infrastructure/query/auth.query-repository';
import { LocalStrategy } from './guards/local/local.strategy';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { AuthQueryService } from './application/query/auth.query-service';
import { BasicStrategy } from './guards/basic/basic.strategy';
import { AdaptersModule } from '../../core/adapters/adapters.module';
import { appConfig } from '../../core/settings/config';
import { JwtAuthGuard } from './guards/bearer/jwt-auth.guard';
import { BasicAuthGuard } from './guards/basic/basic-auth.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CreateUserUseCase } from './application/usecases/admins/create-user.usecase';
import { UserValidationService } from './application/services/user-validation.service';
import { DeleteUserUseCase } from './application/usecases/admins/delete-user.usecase';
import { LoginUserUseCase } from './application/usecases/login-user.usecase';
import { AuthValidationService } from './application/services/auth-validation.service';
import { RegisterUserUseCase } from './application/usecases/users/register-user.usecase';
import { LocalAuthGuard } from './guards/local/local-auth.guard';
import { ResendRegistrationCodeUseCase } from './application/usecases/users/resend-registration-code-user.usecase';
import { ConfirmRegistrationCodeUseCase } from './application/usecases/users/confirm-registration-code-user.usecase';
import { RecoveryPasswordUseCase } from './application/usecases/users/recovery-password-user.usecase';
import { ConfirmPasswordUseCase } from './application/usecases/users/confirm-password-user.usecase';
import { UsersFactory } from './application/factories/users.factory';
import { SendConfirmationEmailWhenUserRegisteredEventHandler } from '../notifications/application/event-handlers/send-confirmation-email-when-user-registered.event-handler';
import {
  SendSmsWhenUserRegisteredEventHandler
} from '../notifications/application/event-handlers/send-sms-when-user-registered.event-handler';

const services = [
  UsersQueryService,
  AuthQueryService,
  AuthValidationService,
  UserValidationService,
  CryptoService,
];

const strategies = [JwtStrategy, BasicStrategy, LocalStrategy];

const guards = [BasicAuthGuard, JwtAuthGuard, LocalAuthGuard, ThrottlerGuard];

const commandHandlers = [
  CreateUserUseCase,
  DeleteUserUseCase,
  LoginUserUseCase,
  RegisterUserUseCase,
  ResendRegistrationCodeUseCase,
  ConfirmRegistrationCodeUseCase,
  RecoveryPasswordUseCase,
  ConfirmPasswordUseCase,
];

const eventHandlers = [
  SendConfirmationEmailWhenUserRegisteredEventHandler,
  SendSmsWhenUserRegisteredEventHandler,
];

@Module({
  imports: [
    CqrsModule,
    //если в системе несколько токенов (например, access и refresh) с разными опциями (время жизни, секрет)
    //можно переопределить опции при вызове метода jwt.service.sign
    //или написать свой tokens сервис (адаптер), где эти опции будут уже учтены
    //или использовать useFactory и регистрацию через токены для JwtService,
    //для создания нескольких экземпляров в IoC с разными настройками (пример в следующих занятиях)
    JwtModule.register({
      secret: appConfig.AT_SECRET, //TODO: move to env. will be in the following lessons
      signOptions: { expiresIn: appConfig.AT_TIME }, // Время жизни токена
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 5,
      },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    NotificationsModule,
    AdaptersModule,
  ],
  controllers: [UsersController, AuthController],
  providers: [
    UsersRepository,
    UsersQueryRepository,
    AuthQueryRepository,
    UsersFactory,
    ...commandHandlers,
    ...eventHandlers,
    ...services,
    ...guards,
    ...strategies,
  ],
  exports: [
    UsersRepository,
    AuthValidationService,
    BasicAuthGuard,
    JwtAuthGuard,
    BasicStrategy,
    JwtStrategy,
    JwtModule,
  ],
})
export class UserAccountsModule {}

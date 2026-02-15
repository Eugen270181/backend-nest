import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './api/users.controller';
import { AuthController } from './api/auth.controller';
import { User, UserSchema } from './domain/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { CryptoService } from './application/services/crypto.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthQueryRepository } from './infrastructure/query/auth.query-repository';
import { LocalStrategy } from './guards/local/local.strategy';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
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
import { GetAllUsersQueryHandler } from './application/queries/get-all-users.query';
import { GetUserQueryHandler } from './application/queries/get-user.query';
import { GetMeQueryHandler } from './application/queries/get-me.query';
import { SessionsController } from './api/sessions.controller';
import { JwtRefreshStrategy } from './guards/bearer/jwt-refresh.strategy';
import { JwtRefreshAuthGuard } from './guards/bearer/jwt-refresh-auth.guard';
import {
  ACCESS_TOKEN_SERVICE,
  REFRESH_TOKEN_SERVICE,
} from './guards/tokens.constants';
import { GenerateTokensUseCase } from './application/usecases/generate-tokens.usecase';
import { CreateSessionUseCase } from './application/usecases/sessions/create-session.usecase';
import { SessionsRepository } from './infrastructure/sessions.repository';
import { Session, SessionSchema } from './domain/session.entity';
import { RefreshTokensUseCase } from './application/usecases/refresh-tokens.usecase';
import { DeleteUserSessionByIdUseCase } from './application/usecases/sessions/delete-user-session-by-id-use.case';
import { GetSessionDocumentQueryHandler } from './application/queries/get-session-document.query';
import { DeleteUserSessionsExcCurUseCase } from './application/usecases/sessions/delete-user-sessions-exc-cur-use.case';
import { GetUserActiveSessionsQueryHandler } from './application/queries/get-user-active-sessions.query';
import { SessionsQueryRepository } from './infrastructure/query/sessions.query-repository';
import { LogoutUserUseCase } from './application/usecases/logout-user.usecase';

const services = [AuthValidationService, UserValidationService, CryptoService];

const strategies = [
  JwtStrategy,
  JwtRefreshStrategy,
  BasicStrategy,
  LocalStrategy,
];

const guards = [
  BasicAuthGuard,
  JwtAuthGuard,
  JwtRefreshAuthGuard,
  LocalAuthGuard,
  ThrottlerGuard,
];

const queryHandlers = [
  GetAllUsersQueryHandler,
  GetUserQueryHandler,
  GetMeQueryHandler,
  GetSessionDocumentQueryHandler,
  GetUserActiveSessionsQueryHandler,
];

const commandHandlers = [
  CreateUserUseCase,
  DeleteUserUseCase,
  GenerateTokensUseCase,
  CreateSessionUseCase,
  DeleteUserSessionByIdUseCase,
  DeleteUserSessionsExcCurUseCase,
  LoginUserUseCase,
  RefreshTokensUseCase,
  LogoutUserUseCase,
  RegisterUserUseCase,
  ResendRegistrationCodeUseCase,
  ConfirmRegistrationCodeUseCase,
  RecoveryPasswordUseCase,
  ConfirmPasswordUseCase,
];

@Module({
  imports: [
    CqrsModule,
    //если в системе несколько токенов (например, access и refresh) с разными опциями (время жизни, секрет)
    //можно переопределить опции при вызове метода jwt.service.sign
    //или написать свой tokens сервис (адаптер), где эти опции будут уже учтены
    //или использовать useFactory и регистрацию через токены для JwtService,
    //для создания нескольких экземпляров в IoC с разными настройками (пример в следующих занятиях)
    JwtModule.register({}),
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 5,
      },
    ]),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    NotificationsModule,
    AdaptersModule,
  ],
  controllers: [UsersController, AuthController, SessionsController],
  providers: [
    // Регистрируем два разных JwtService с разными настройками
    {
      provide: ACCESS_TOKEN_SERVICE,
      useFactory: (): JwtService => {
        return new JwtService({
          secret: appConfig.AT_SECRET,
          signOptions: {
            expiresIn: appConfig.AT_TIME,
          },
        });
      },
    },
    {
      provide: REFRESH_TOKEN_SERVICE,
      useFactory: (): JwtService => {
        return new JwtService({
          secret: appConfig.RT_SECRET,
          signOptions: {
            expiresIn: appConfig.RT_TIME,
          },
        });
      },
    },
    ...guards,
    ...strategies,
    ...commandHandlers,
    ...queryHandlers,
    UsersFactory,
    ...services,
    UsersRepository,
    UsersQueryRepository,
    SessionsRepository,
    SessionsQueryRepository,

    AuthQueryRepository,
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

import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './api/users.controller';
import { SecurityDevicesController } from './api/security-devices.controller';
import { AuthController } from './api/auth.controller';
import { UsersService } from './application/users.service';
import { User, UserSchema } from './domain/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { UsersExternalQueryRepository } from './infrastructure/external-query/users.external-query-repository';
import { UsersExternalService } from './application/external/users.external-service';
import { UsersQueryService } from './application/query/users.query-service';
import { JwtModule } from '@nestjs/jwt';
import { CryptoService } from './application/crypto.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SecurityDevicesQueryRepository } from './infrastructure/query/security-devices.query-repository';
import { AuthQueryRepository } from './infrastructure/query/auth.query-repository';
import { LocalStrategy } from './guards/local/local.strategy';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { AuthService } from './application/auth.service';
import { AuthQueryService } from './application/query/auth.query-service';
import { BasicStrategy } from './guards/basic/basic.strategy';
import { AdaptersModule } from '../../core/adapters/adapters.module';
import { appConfig } from '../../core/settings/config';
import { JwtAuthGuard } from './guards/bearer/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local/local-auth.guard';
import { BasicAuthGuard } from './guards/basic/basic-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    //если в системе несколько токенов (например, access и refresh) с разными опциями (время жизни, секрет)
    //можно переопределить опции при вызове метода jwt.service.sign
    //или написать свой tokens сервис (адаптер), где эти опции будут уже учтены
    //или использовать useFactory и регистрацию через токены для JwtService,
    //для создания нескольких экземпляров в IoC с разными настройками (пример в следующих занятиях)
    JwtModule.register({
      secret: appConfig.AT_SECRET, //TODO: move to env. will be in the following lessons
      signOptions: { expiresIn: appConfig.AT_TIME }, // Время жизни токена
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    NotificationsModule,
    AdaptersModule,
  ],
  controllers: [UsersController, AuthController, SecurityDevicesController],
  providers: [
    UsersService,
    UsersQueryService,
    UsersRepository,
    UsersQueryRepository,
    AuthService,
    AuthQueryService,
    AuthQueryRepository,
    CryptoService,
    SecurityDevicesQueryRepository,
    LocalStrategy,
    BasicStrategy,
    BasicAuthGuard,
    JwtStrategy,
    JwtAuthGuard,
    UsersExternalQueryRepository,
    UsersExternalService,
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard, // глобально активируем ThrottlerGuard
    // },
  ],
  exports: [
    BasicAuthGuard,
    BasicStrategy,
    JwtAuthGuard,
    JwtStrategy,
    UsersExternalQueryRepository,
    UsersExternalService,
  ],
})
export class UserAccountsModule {}
//   implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer
//       .apply(LoginValidationMiddleware)
//       .forRoutes({ path: 'auth/login', method: RequestMethod.POST });
//   }
// }

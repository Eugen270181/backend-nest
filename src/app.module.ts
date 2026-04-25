// import of this config module must be on the top of imports
import { configModule } from './config-dynamic-module';
import { CoreModule } from './core/core.module';
import { DynamicModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { TestingModule } from './modules/testing/testing.module';
import { BloggersPlatformModule } from './modules/blogers-platform/bloggers-platform.module';
import { APP_FILTER } from '@nestjs/core';
import { AllHttpExceptionsFilter } from './core/exceptions/filters/all-exception.filter';
import { DomainHttpExceptionsFilter } from './core/exceptions/filters/domain-exception.filter';
import { ThrottlerExceptionFilter } from './core/exceptions/filters/throttler-exception.filter';
import { CoreConfig } from './core/core.config';

@Module({
  imports: [
    //TODO: move to env. will be in the following lessons
    MongooseModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => {
        const uri = coreConfig.mongoURI;

        console.log('DB_URI', uri);
        console.log('NODE_ENV', coreConfig.node_env);

        return {
          uri: uri,
        };
      },
      inject: [CoreConfig],
    }),

    //MongooseModule.forRoot('mongodb://localhost/nest-blogger-platform'),
    configModule,
    CoreModule,
    UserAccountsModule,
    BloggersPlatformModule,
  ],
  controllers: [AppController],
  providers: [
    //   {
    //     provide: APP_GUARD,
    //     useClass: ThrottlerGuard, // глобально активируем ThrottlerGuard
    //   },
    AppService,
    //регистрация глобальных exception filters
    //важен порядок регистрации! Первым сработает DomainHttpExceptionsFilter!
    {
      provide: APP_FILTER,
      useClass: AllHttpExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainHttpExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ThrottlerExceptionFilter, // 429 первыми
    },
  ],
})
export class AppModule {
  static async forRoot(coreConfig: CoreConfig): Promise<DynamicModule> {
    // такой мудрёный способ мы используем, чтобы добавить к основным модулям необязательный модуль.
    // чтобы не обращаться в декораторе к переменной окружения через process.env в декораторе, потому что
    // запуск декораторов происходит на этапе склейки всех модулей до старта жизненного цикла самого NestJS

    return {
      module: AppModule,
      imports: [...(coreConfig.includeTestingModule ? [TestingModule] : [])], // Add dynamic modules here
    };
  }
}

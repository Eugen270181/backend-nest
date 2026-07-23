// import of this config module must be on the top of imports
import { configModule } from './config-dynamic-module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { CoreModule } from './core/core.module';
import { Logger, Module } from '@nestjs/common';
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
import { ensureDatabaseExistCreateIfNot } from './ensure-database-exist-create-if-not';

@Module({
  imports: [
    // 1. Подключение к MongoDB
    MongooseModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => ({
        uri: coreConfig.mongoURI,
      }),
      inject: [CoreConfig],
    }),

    TypeOrmModule.forRootAsync({
      inject: [CoreConfig],
      useFactory: (coreConfig: CoreConfig) => ({
        type: 'postgres' as const,
        url: coreConfig.postgresURI,
        synchronize: false,
      }),
      dataSourceFactory: async (
        options?: DataSourceOptions,
      ): Promise<DataSource> => {
        const logger = new Logger('PostgresBootstrap');

        // сужение discriminated union: после проверки type === 'postgres'
        // TS сам знает, что это PostgresConnectionOptions и у него есть url
        if (!options || options.type !== 'postgres' || !options.url) {
          throw new Error(
            'В настройках TypeORM отсутствует url (POSTGRES_URI)',
          );
        }

        await ensureDatabaseExistCreateIfNot(options.url, logger);

        const dataSource = await new DataSource(options).initialize();

        // const schemaSql = readFileSync(join(process.cwd(), 'schema.sql'), 'utf8');
        // await dataSource.query(schemaSql);
        // logger.log('schema.sql применена');

        return dataSource;
      },
    }),

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
    Logger,
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
  static forRoot(includeTestingModule?: boolean) {
    // такой мудрёный способ мы используем, чтобы добавить к основным модулям необязательный модуль.
    // чтобы не обращаться в декораторе к переменной окружения через process.env в декораторе, потому что
    // запуск декораторов происходит на этапе склейки всех модулей до старта жизненного цикла самого NestJS

    return {
      module: AppModule,
      imports: [...(includeTestingModule ? [TestingModule] : [])], // Add dynamic modules here
    };
  }
}

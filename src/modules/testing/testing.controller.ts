import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
// Legacy MongoDB testing imports, intentionally disabled:
// import { InjectConnection } from '@nestjs/mongoose';
// import { Connection } from 'mongoose';
import { DataSource } from 'typeorm';
import { CoreConfig, Environments } from '../../core/core.config';
import { DomainException } from '../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../core/exceptions/domain-exception-codes';

@Controller('testing')
export class TestingController {
  constructor(
    private coreConfig: CoreConfig,
    // @InjectConnection() private readonly databaseConnection: Connection,
    private readonly dataSource: DataSource,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('testingController created');
  }

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    // Defense in depth: this destructive IT-incubator helper must never run outside tests.
    if (this.coreConfig.node_env !== Environments.TESTING) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Database cleanup is available only in testing.',
      });
    }

    const databaseName = decodeURIComponent(
      new URL(this.coreConfig.postgresURI).pathname.replace(/^\//, ''),
    );
    // Require a clearly test-only database name, even if NODE_ENV is misconfigured.
    if (!/(?:^|[-_])(test|testing|incubator|incubatora)(?:[-_]|$)/i.test(databaseName)) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Refusing to clean a database not named as a test database.',
      });
    }

    // Legacy MongoDB collection cleanup (disabled):
    // const collections = await this.databaseConnection.listCollections();
    // await Promise.all(collections.map((collection) =>
    //   this.databaseConnection.collection(collection.name).deleteMany({}),
    // ));
    // PostgreSQL cleanup remains active:
    await this.dataSource.query(
      'TRUNCATE TABLE users, blogs, posts, comments, comment_likes, post_likes CASCADE',
    );

    return {
      status: 'succeeded',
    };
  }
}

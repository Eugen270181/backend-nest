import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { DataSource } from 'typeorm';
import { CoreConfig } from '../../core/core.config';

@Controller('testing')
export class TestingController {
  constructor(
    private coreConfig: CoreConfig,
    @InjectConnection() private readonly databaseConnection: Connection,
    private readonly dataSource: DataSource,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('testingController created');
  }

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    const collections = await this.databaseConnection.listCollections();

    const promises: Promise<unknown>[] = collections.map((collection) =>
      this.databaseConnection.collection(collection.name).deleteMany({}),
    );
    //TRUNCATE быстрее DELETE и через CASCADE сразу чистит зависимые таблицы (sessions)
    promises.push(this.dataSource.query('TRUNCATE TABLE users CASCADE'));

    await Promise.all(promises);

    return {
      status: 'succeeded',
    };
  }
}

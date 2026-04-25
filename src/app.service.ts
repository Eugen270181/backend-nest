import { Injectable } from '@nestjs/common';
import { CoreConfig } from './core/core.config';

@Injectable()
export class AppService {
  constructor(private coreConfig: CoreConfig) {
    if (this.coreConfig.IOC_LOG) console.log('AppService created');
  }
  getHello(): string {
    return 'Hello World!';
  }
}

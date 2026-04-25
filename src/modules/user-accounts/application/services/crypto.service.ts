import bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { CoreConfig } from '../../../../core/core.config';

@Injectable()
export class CryptoService {
  constructor(private coreConfig: CoreConfig) {
    if (this.coreConfig.IOC_LOG) console.log('CryptoService created');
  }
  async getHash(password: string, saltRounds?: number) {
    const saltRound = saltRounds ? saltRounds : 10;
    return bcrypt.hash(password, saltRound);
  }

  async checkHash(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}

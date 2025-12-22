import bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { appConfig } from '../../../../core/settings/config';

@Injectable()
export class CryptoService {
  constructor() {
    if (appConfig.IOC_LOG) console.log('CryptoService created');
  }
  async getHash(password: string, saltRounds?: number) {
    const saltRound = saltRounds ? saltRounds : 10;
    return bcrypt.hash(password, saltRound);
  }

  async checkHash(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}

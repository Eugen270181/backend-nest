import bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
@Injectable()
export class HashService {
  constructor() {
    console.log('HashService created');
  }
  async getHash(password: string, saltRounds?: number) {
    const saltRound = saltRounds ? saltRounds : 10;
    return bcrypt.hash(password, saltRound);
  }

  async checkHash(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}

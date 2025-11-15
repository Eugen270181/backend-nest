import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CodeService {
  genRandomCode(): string {
    return randomUUID();
  }
}

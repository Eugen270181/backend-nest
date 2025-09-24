import { Controller } from '@nestjs/common';
import { appConfig } from '../../../core/settings/config';

@Controller('auth')
export class AuthController {
  constructor() {
    if (appConfig.IOC_LOG) console.log('AuthController created');
  }
}

import { Controller } from '@nestjs/common';
import { appConfig } from '../../../core/settings/config';

@Controller('security-devices')
export class SecurityDevicesController {
  constructor() {
    if (appConfig.IOC_LOG) console.log('SecurityDevicesController created');
  }
}

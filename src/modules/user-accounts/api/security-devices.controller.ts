import { Controller } from '@nestjs/common';

@Controller('security-devices')
export class SecurityDevicesController {
  constructor() {
    console.log('SecurityDevicesController created');
  }
}

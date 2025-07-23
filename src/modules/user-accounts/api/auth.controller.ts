import { Controller } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor() {
    console.log('AuthController created');
  }
}

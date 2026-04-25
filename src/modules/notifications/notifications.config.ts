import { Injectable } from '@nestjs/common';
import { IsEmail, IsString } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { configValidationUtility } from '../../setup/config-validation.utility';

@Injectable()
export class NotificationsConfig {
  @IsEmail({}, { message: 'Set notify email correctly...' })
  email!: string;
  @IsString({ message: 'Set pass for notify email...' })
  emailPass!: string;

  constructor(private configService: ConfigService<any, true>) {
    this.email = this.configService.get('EMAIL');
    this.emailPass = this.configService.get('EMAIL_PASS');

    configValidationUtility.validateConfig(this);
  }
}

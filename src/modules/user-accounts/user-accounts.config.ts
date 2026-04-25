import { IsNotEmpty, IsString } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { configValidationUtility } from '../../setup/config-validation.utility';

@Injectable()
export class UserAccountsConfig {
  @IsNotEmpty({ message: 'Set ACCESS_TOKEN_EXPIRE_IN...' })
  accessTokenExpireIn!: string;

  @IsNotEmpty({ message: 'Set REFRESH_TOKEN_EXPIRE_IN...' })
  refreshTokenExpireIn!: string;

  @IsString()
  saLogin!: string; // можно добавить валидацию: min length и т.д.

  @IsString()
  saPass!: string;

  @IsString()
  emailTime!: string; // например, '1h'

  @IsString()
  passTime!: string;

  constructor(private configService: ConfigService<any, true>) {
    this.accessTokenExpireIn = this.configService.get('ACCESS_TOKEN_EXPIRE_IN');
    this.refreshTokenExpireIn = this.configService.get(
      'REFRESH_TOKEN_EXPIRE_IN',
    );
    this.saLogin = this.configService.get('SA_LOGIN') ?? 'admin';
    this.saPass = this.configService.get('SA_PASS') ?? 'qwerty';
    this.emailTime = this.configService.get('EMAIL_TIME') ?? '1h';
    this.passTime = this.configService.get('PASS_TIME') ?? '1h';

    configValidationUtility.validateConfig(this);
  }
}

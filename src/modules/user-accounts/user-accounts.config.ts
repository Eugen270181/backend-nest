import { IsNotEmpty, IsString } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { configValidationUtility } from '../../config-validation.utility';

@Injectable()
export class UserAccountsConfig {
  @IsNotEmpty({ message: 'Set ACCESS_TOKEN_EXPIRE_IN...' })
  accessTokenExpireIn!: string;

  @IsNotEmpty({ message: 'Set REFRESH_TOKEN_EXPIRE_IN...' })
  refreshTokenExpireIn!: string;

  @IsNotEmpty({ message: 'Set SA_LOGIN to configure the super-admin login.' })
  @IsString()
  saLogin!: string;

  @IsNotEmpty({ message: 'Set SA_PASS to configure the super-admin password.' })
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
    // Do not fall back to known default administrator credentials.
    this.saLogin = this.configService.get('SA_LOGIN');
    this.saPass = this.configService.get('SA_PASS');
    this.emailTime = this.configService.get('EMAIL_TIME') ?? '1h';
    this.passTime = this.configService.get('PASS_TIME') ?? '1h';

    configValidationUtility.validateConfig(this);
  }
}

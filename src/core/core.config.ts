import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { configValidationUtility } from '../setup/config-validation.utility';

export enum Environments {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

// each module has it's own *.config.ts

@Injectable()
export class CoreConfig {
  @IsNumber(
    {},
    {
      message: 'Set Env variable PORT, example: 3000',
    },
  )
  port!: number;

  @IsNotEmpty({
    message:
      'Set Env variable MONGO_URI, example: mongodb://localhost:27017/my-app-local-db',
  })
  mongoURI!: string;

  @IsEnum(Environments, {
    message:
      'Set correct NODE_ENV value, available values: ' +
      configValidationUtility.getEnumValues(Environments).join(', '),
  })
  node_env!: string;

  @IsBoolean({
    message:
      'Set Env variable IS_SWAGGER_ENABLED to enable/disable Swagger, example: true, available values: true, false',
  })
  isSwaggerEnabled!: boolean;

  @IsBoolean({
    message:
      'Set Env variable INCLUDE_TESTING_MODULE to enable/disable Dangerous for production TestingModule, example: true, available values: true, false, 0, 1',
  })
  includeTestingModule!: boolean;

  @IsBoolean({
    message:
      'Set Env variable SEND_INTERNAL_SERVER_ERROR_DETAILS to enable/disable Dangerous for production internal server error details (message, etc), example: true, available values: true, false, 0, 1',
  })
  sendInternalServerErrorDetails!: boolean;

  @IsOptional()
  @IsBoolean({
    message: 'IOC_LOG must be boolean (true/false, 0/1, enabled/disabled)',
  })
  IOC_LOG?: boolean;

  @IsNotEmpty({
    message: 'Set Env variable ACCESS_TOKEN_SECRET, dangerous for security!',
  })
  accessTokenSecret!: string;
  @IsNotEmpty({
    message: 'Set Env variable REFRESH_TOKEN_SECRET, dangerous for security!',
  })
  refreshTokenSecret!: string;

  constructor(private configService: ConfigService<any, true>) {
    this.port = Number(this.configService.get('PORT'));
    this.mongoURI = this.configService.get('MONGO_URI');
    this.node_env = this.configService.get('NODE_ENV');

    this.accessTokenSecret = this.configService.get('ACCESS_TOKEN_SECRET');
    this.refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');

    this.isSwaggerEnabled =
      configValidationUtility.convertToBoolean(
        this.configService.get('IS_SWAGGER_ENABLED'),
      ) ?? false;
    this.includeTestingModule =
      configValidationUtility.convertToBoolean(
        this.configService.get('INCLUDE_TESTING_MODULE'),
      ) ?? false;
    this.sendInternalServerErrorDetails =
      configValidationUtility.convertToBoolean(
        this.configService.get('SEND_INTERNAL_SERVER_ERROR_DETAILS'),
      ) ?? false;
    this.IOC_LOG =
      configValidationUtility.convertToBoolean(
        this.configService.get('IOC_LOG'),
      ) ?? false; // дефолт false

    configValidationUtility.validateConfig(this);
  }
}

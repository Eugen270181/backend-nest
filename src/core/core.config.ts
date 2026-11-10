import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsInt,
  IsNumber,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';
import { configValidationUtility } from '../config-validation.utility';

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

  // Number of trusted reverse-proxy hops. Default 0 means trust no forwarded headers.
  @IsInt()
  @Min(0)
  trustProxyHops!: number;

  // MongoDB configuration is kept for possible future use; no Mongo connection is started.
  @IsOptional()
  @IsNotEmpty({
    message:
      'Set Env variable MONGO_URI, example: mongodb://localhost:27017/my-app-local-db',
  })
  mongoURI?: string;

  @IsNotEmpty({
    message:
      'Set Env variable POSTGRES_URI, example: postgresql://postgres:pass@localhost:5432/my-app-local-db',
  })
  postgresURI!: string;

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

  @IsString({
    message: 'Set Env variable GEMINI_API_KEY_1, for AI use!',
  })
  geminiApiKey1!: string;

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
    this.trustProxyHops = Number(
      this.configService.get('TRUST_PROXY_HOPS') ?? 0,
    );
    this.mongoURI = this.configService.get('MONGO_URI') || undefined;
    this.postgresURI = this.configService.get('POSTGRES_URI');
    this.node_env = this.configService.get('NODE_ENV');

    this.accessTokenSecret = this.configService.get('ACCESS_TOKEN_SECRET');
    this.refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
    // Добавлено нижнее подчеркивание перед единицей: GEMINI_API_KEY_1
    const geminiKey = this.configService.get('GEMINI_API_KEY_1');
    this.geminiApiKey1 =
      geminiKey && geminiKey !== 'undefined' ? String(geminiKey) : '';

    const swaggerRequested =
      configValidationUtility.convertToBoolean(
        this.configService.get('IS_SWAGGER_ENABLED'),
      ) ?? false;
    // Swagger exposes an API catalogue and must remain disabled in production.
    this.isSwaggerEnabled =
      this.node_env !== Environments.PRODUCTION && swaggerRequested;
    // The flag is opt-in, but can never enable the destructive module outside tests.
    this.includeTestingModule =
      this.node_env === Environments.TESTING &&
      (configValidationUtility.convertToBoolean(
        this.configService.get('INCLUDE_TESTING_MODULE'),
      ) ?? false);
    const internalDetailsRequested =
      configValidationUtility.convertToBoolean(
        this.configService.get('SEND_INTERNAL_SERVER_ERROR_DETAILS'),
      ) ?? false;
    // Never reveal internal exception details to clients in production, even if env is misconfigured.
    this.sendInternalServerErrorDetails =
      this.node_env !== Environments.PRODUCTION && internalDetailsRequested;
    this.IOC_LOG =
      configValidationUtility.convertToBoolean(
        this.configService.get('IOC_LOG'),
      ) ?? false; // дефолт false

    configValidationUtility.validateConfig(this);
  }
}

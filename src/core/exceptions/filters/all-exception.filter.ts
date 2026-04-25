//Все ошибки
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ErrorResponseBody } from '../error-responce-body.type';
import { DomainExceptionCode } from '../domain-exception-codes';
import { Response, Request } from 'express';
import { CoreConfig } from '../../core.config';
@Catch()
export class AllHttpExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly coreConfig: CoreConfig,
    private readonly logger: Logger,
  ) {}

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // важно: саму ошибку всегда логгируем на сервере (клиенту не отдаём)
    this.logger.error(exception?.message, exception?.stack);

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception?.message ?? 'Unknown exception occurred.';
    response.status(status).json(this.buildResponseBody(request.url, message));
  }

  private buildResponseBody(
    requestUrl: string,
    message: string,
  ): ErrorResponseBody {
    const showDetails = this.coreConfig.sendInternalServerErrorDetails;

    if (!showDetails) {
      return {
        timestamp: new Date().toISOString(),
        path: null,
        message: 'Some error occurred',
        errorsMessages: [],
        code: DomainExceptionCode.InternalServerError,
      };
    }
    return {
      timestamp: new Date().toISOString(),
      path: requestUrl,
      message,
      errorsMessages: [],
      code: DomainExceptionCode.InternalServerError,
    };
  }
}

// @Catch()
// export class AllHttpExceptionsFilter implements ExceptionFilter {
//   constructor(private coreConfig: CoreConfig) {}
//
//   catch(exception: any, host: ArgumentsHost): void {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();
//     const request = ctx.getRequest<Request>();
//
//     const message = exception.message || 'Unknown exception occurred.';
//     const status = HttpStatus.INTERNAL_SERVER_ERROR;
//     const responseBody = this.buildResponseBody(request.url, message);
//
//     response.status(status).json(responseBody);
//   }
//
//   private buildResponseBody(
//     requestUrl: string,
//     message: string,
//   ): ErrorResponseBody {
//     const isProduction = this.coreConfig.node_env === 'production';
//
//     if (isProduction) {
//       return {
//         timestamp: new Date().toISOString(),
//         path: null,
//         message: 'Some error occurred',
//         errorsMessages: [],
//         code: DomainExceptionCode.InternalServerError,
//       };
//     }
//
//     return {
//       timestamp: new Date().toISOString(),
//       path: requestUrl,
//       message,
//       errorsMessages: [],
//       code: DomainExceptionCode.InternalServerError,
//     };
//   }
// }

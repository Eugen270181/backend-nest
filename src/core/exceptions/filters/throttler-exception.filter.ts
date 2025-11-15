import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    response.status(429).json({
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message || 'Too Many Requests',
      code: 'TooManyRequests', // либо ваша доменная константа
      errorsMessages: [],
    });
  }
}

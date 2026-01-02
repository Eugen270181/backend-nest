import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    //console.log('Request...', req.method, req.url);
    next();
  }
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // Используем встроенный Logger вместо console.log
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const userAgent = request.get('user-agent') || '';
    const user = request.user?.username || 'anonymous'; // Из AuthGuard

    // Логируем начало обработки запроса
    this.logger.log(
      `➡️  ${method} ${url} - User: ${user} - Agent: ${userAgent}`,
    );

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          // Логируем успешное завершение
          const duration = Date.now() - startTime;
          this.logger.log(`✅  ${method} ${url} - ${duration}ms`);
        },
        error: (error) => {
          // Логируем ошибки с дополнительной информацией
          const duration = Date.now() - startTime;
          this.logger.error(
            `❌  ${method} ${url} - ${duration}ms - Error: ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }
}

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    // console.log(
    //   `Запрос: ${method} ${url} - начат в ${new Date(now).toISOString()}`,
    // );

    // "next.handle()" возвращает Observable, который представляет поток ответа.
    // Мы используем tap() из RxJS, чтобы выполнить побочное действие (логирование) без изменения ответа.
    return next
      .handle()
      .pipe(
        tap(() =>
          console.log(
            `Ответ: ${method} ${url} - завершен за ${Date.now() - now}ms`,
          ),
        ),
      );
  }
}

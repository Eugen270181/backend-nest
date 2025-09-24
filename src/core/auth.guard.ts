import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { DomainException } from './exceptions/domain-exceptions';
import { DomainExceptionCode } from './exceptions/domain-exception-codes';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();

    // Получаем токен из заголовка Authorization
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: `AuthGard - Forbidden, no authorization key in header request`,
      }); // Токен отсутствует
    }

    // Проверяем формат заголовка: Bearer <token>
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return false; // Неверный формат
    }
    // Проверяем валидность токена (в реальном приложении здесь должна быть криптографическая проверка)
    if (token !== `123`) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: `AuthGard - Forbidden for Token: ${token}`,
      });
    }

    return true;
  }
}

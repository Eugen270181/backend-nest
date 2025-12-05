import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  // ✅ Проверяем метаданные ДО вызова стратегии
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // ✅ Пропускаем без JWT — req.user от middleware сохраняется!
    }

    // ✅ Вызываем стратегию JWT (только если не public)
    return super.canActivate(context);
  }

  // ✅ Обработка результата стратегии
  handleRequest<UserContextExtDto>(
    err: any,
    user: UserContextExtDto,
    info: any,
  ): UserContextExtDto {
    console.log('🔒 JWT GUARD:', { err: !!err, user: !!user, info });

    if (err || !user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Unauthorized',
      });
    }

    return user; // ✅ Записывается в req.user
  }
}

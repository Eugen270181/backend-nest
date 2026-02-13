import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
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
      return true;
    }
    console.log('can activate method of jwtRefresh-authguard');
    // ✅ Вызываем стратегию JWT (только если не public)
    return super.canActivate(context); //super.canActivate() вызывает passport.authenticate()->call strategy class
  }

  // ✅ Обработка результата стратегии
  handleRequest<UserContextDto>(
    err: any,
    user: UserContextDto,
    info: any,
  ): UserContextDto {
    console.log(user);
    if (err || !user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Unauthorized',
      });
    }

    return user;
  }
}

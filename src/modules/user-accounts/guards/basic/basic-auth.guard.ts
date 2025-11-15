import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class BasicAuthGuard extends AuthGuard('basic') {
  constructor(private reflector: Reflector) {
    super();
  }

  handleRequest(err, user, info, context, status) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // Если public — пропускаем без ошибок
      return true;
    }
    if (err) {
      // Если внутри стратегии или passport-http пришла ошибка, выбрасываем её
      throw err;
    }

    if (!user) {
      // Пользователь не найден или данные не переданы
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Unauthorized',
      });
    }

    return user;
  }
}

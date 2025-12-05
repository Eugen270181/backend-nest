// decorators/user-id.decorator.ts
import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { UserContextDto } from '../../dto/user-context.dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

/**
 * Обязательный userId — для защищенных роутов с JwtAuthGuard
 * Выбрасывает 401 если user отсутствует
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user: UserContextDto = request.user;

    if (!user?.id) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized, //401
        message: 'Invalid username or password',
      });
    }

    return user.id;
  },
);

/**
 * Опциональный userId — для публичных роутов с OptionalJwtMiddleware
 * Возвращает undefined если токена нет или он невалидный
 */
export const OptionalUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user: UserContextDto | null = request.user;

    return user?.id;
  },
);

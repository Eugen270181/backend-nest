// decorators/user-id.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContextDto } from '../../dto/user-context.dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { RefreshTokenPayloadDto } from '../../dto/refresh-token-payload.dto';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserContextDto => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized, //401
        message: `Its no userID`,
      });
    }

    return user as UserContextDto;
  },
);

/**
 * Обязательный userId — для защищенных роутов с JwtAuthGuard
 * Выбрасывает 401 если user отсутствует
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user: UserContextDto = request.user;

    if (!user?.userId) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized, //401
        message: `Its no userID`,
      });
    }

    return user.userId;
  },
);

export const DeviceId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const jwtPayload: RefreshTokenPayloadDto = request.user;

    if (!jwtPayload?.deviceId) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized, //401
        message: `Its no deviceID`,
      });
    }

    return jwtPayload.deviceId;
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

    return user?.userId;
  },
);

import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthValidationService } from '../../application/services/auth-validation.service';
import { appConfig } from '../../../../core/settings/config';
import { UserContextDto } from '../dto/user-context.dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { RefreshTokenPayloadDto } from '../dto/refresh-token-payload.dto';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private authValidationService: AuthValidationService) {
    super({
      jwtFromRequest: JwtRefreshStrategy.extractJWTFromCookie,
      ignoreExpiration: false,
      secretOrKey: appConfig.RT_SECRET, // Другой секрет для RT
      passReqToCallback: true, // Чтобы получить доступ к Request
    });
  }

  // Кастомный экстрактор для получения токена из cookie
  private static extractJWTFromCookie(req: Request): string | null {
    if (req.cookies && req.cookies.refreshToken) {
      return req.cookies.refreshToken as string;
    }
    return null;
  }

  async validate(
    req: Request,
    jwtPayload: RefreshTokenPayloadDto,
  ): Promise<UserContextDto> {
    console.log(jwtPayload);
    if (!jwtPayload.userId) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'UserId in refresh token payload - not found',
      });
    }

    if (!jwtPayload.deviceId) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'DeviceId in refresh token payload - not found',
      });
    }

    //проверка на то, что активному токену соответствует сессия в бд,
    //те что он не протух на уровне внутренних польз.сессий
    const userContextDto: UserContextDto | null =
      await this.authValidationService.validateRefreshToken(jwtPayload);

    if (!userContextDto) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid refresh token or expired session',
      });
    }

    return userContextDto;
  }
}

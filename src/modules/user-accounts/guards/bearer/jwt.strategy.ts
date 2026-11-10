import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserContextDto } from '../dto/user-context.dto';
import { RefreshTokenPayloadDto } from '../dto/refresh-token-payload.dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { AuthValidationService } from '../../application/services/auth-validation.service';
import { CoreConfig } from '../../../../core/core.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private authValidationService: AuthValidationService,
    coreConfig: CoreConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: coreConfig.accessTokenSecret,
    });
  }

  /**
   * функция принимает payload из jwt токена и возвращает то, что впоследствии будет записано в req.user
   * @param payload
   **/
  async validate(
    payload: RefreshTokenPayloadDto,
  ): Promise<UserContextDto> {
    // Check the DB-backed session on every authenticated request.
    // Password changes, logout and device revocation invalidate old access tokens.
    const userContext =
      await this.authValidationService.validateAccessToken(payload);

    if (!userContext) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized, //401
        message: 'UserId in jwt payload - not found',
      });
    }

    return userContext;
  }
}

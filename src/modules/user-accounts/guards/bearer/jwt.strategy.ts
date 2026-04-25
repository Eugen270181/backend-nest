import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserContextDto } from '../dto/user-context.dto';
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
  async validate(payload: UserContextDto): Promise<UserContextDto> {
    //todo with validate user by Id across AuthSevice. DI - dependency in constructor
    const userId = await this.authValidationService.validateUserById(
      payload.userId,
    );

    if (!userId) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized, //401
        message: 'UserId in jwt payload - not found',
      });
    }

    return { userId };
  }
}

import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { UserContextDto } from '../dto/user-context.dto';
import { AuthValidationService } from '../../application/services/auth-validation.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authValidationService: AuthValidationService) {
    super({ usernameField: 'loginOrEmail' });
  }

  //validate возвращает то, что впоследствии будет записано в req.user
  async validate(username: string, password: string): Promise<UserContextDto> {
    //внутренняя валидация гарда на входящие данные - д.б. строки
    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest, //400
        message: 'loginOrEmail and password must be strings',
      });
    }

    //console.log('🚀 STRATEGY VALIDATE ВЫЗВАН:', { username, password });

    const userContextDto = await this.authValidationService.validateUserByCred(
      username,
      password,
    );
    //console.log('✅ STRATEGY USER НАЙДЕН:', !!userContextDto);

    if (!userContextDto) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized, //401
        message: 'Invalid username or password',
      });
    }

    return userContextDto;
  }
}

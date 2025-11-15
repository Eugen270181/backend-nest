import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../../application/auth.service';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { UserContextDto } from '../dto/user-context.dto';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
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

    const user = await this.authService.validateUser(username, password);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized, //401
        message: 'Invalid username or password',
      });
    }

    return user;
  }
}

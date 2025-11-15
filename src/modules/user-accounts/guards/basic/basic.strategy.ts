import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { BasicStrategy as Strategy } from 'passport-http';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy, 'basic') {
  private readonly validUsername = 'admin';
  private readonly validPassword = 'qwerty';
  constructor() {
    super({ passReqToCallback: false });
  }

  public validate = (username, password): boolean => {
    if (this.validUsername === username && this.validPassword === password) {
      return true;
    }
    throw new DomainException({
      code: DomainExceptionCode.Unauthorized,
      message: 'SA - Unauthorized',
    });
  };
}

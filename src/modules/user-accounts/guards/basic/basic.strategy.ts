import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { BasicStrategy as Strategy } from 'passport-http';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { UserAccountsConfig } from '../../user-accounts.config';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy, 'basic') {
  constructor(private readonly userAccountsConfig: UserAccountsConfig) {
    super({ passReqToCallback: false });
  }

  public validate = (username, password): boolean => {
    if (
      this.userAccountsConfig.saLogin === username &&
      this.userAccountsConfig.saPass === password
    ) {
      return true;
    }
    throw new DomainException({
      code: DomainExceptionCode.Unauthorized,
      message: 'SA - Unauthorized',
    });
  };
}

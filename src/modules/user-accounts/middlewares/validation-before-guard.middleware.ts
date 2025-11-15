import { NextFunction, Request, Response } from 'express';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { LoginInputDto } from '../api/input-dto/login.input-dto';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class LoginValidationMiddleware implements NestMiddleware {
  use(
    req: Request<any, any, LoginInputDto>,
    res: Response,
    next: NextFunction,
  ) {
    const body: LoginInputDto = req.body;
    const { loginOrEmail, password } = body || {};

    if (typeof loginOrEmail !== 'string' || typeof password !== 'string') {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'loginOrEmail and password must be strings',
      });
    }
    if (!loginOrEmail.trim() || !password.trim()) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'loginOrEmail and password cannot be empty',
      });
    }

    next();
  }
}

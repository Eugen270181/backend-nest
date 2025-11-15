import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

//этот гард вешаем на логин. Через локальную стратегию проверяются логин и пароль пользователя
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  handleRequest(err, user, info, context, status) {
    //если с validate() прилетает наша ошибка
    if (err) {
      throw err; //400 || 401
    }
    //если отправили не те поля логина и пароля или что-то не отправили вовсе или пустые значения
    if (info?.message === 'Missing credentials') {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest, //400
        message: info.message,
      });
    }
    // Неожиданное поведение — user должен быть, либо быть err
    if (!user) {
      throw new InternalServerErrorException( //500
        'Authentication failed unexpectedly: user missing without error and wrong credentials.',
      );
    }

    return user;
  }
}

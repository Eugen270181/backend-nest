import { DomainExceptionCode } from './domain-exception-codes';

export class ErrorsMessages {
  message: string;
  field: string;
}

export interface IDomainException {
  message: string;
  code: DomainExceptionCode;
  errorsMessages?: ErrorsMessages[];
}

export class DomainException extends Error implements IDomainException {
  message: string;
  code: DomainExceptionCode;
  errorsMessages?: ErrorsMessages[];

  constructor(errorInfo: IDomainException) {
    super(errorInfo.message);
    this.message = errorInfo.message;
    this.code = errorInfo.code;
    this.errorsMessages = errorInfo.errorsMessages;
  }
}

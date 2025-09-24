import { DomainExceptionCode } from './domain-exception-codes';

export class ErrorMessages {
  message: string;
  field: string;
}

export interface IDomainException {
  message: string;
  code: DomainExceptionCode;
  errorMessages?: ErrorMessages[];
}

export class DomainException extends Error implements IDomainException {
  message: string;
  code: DomainExceptionCode;
  errorMessages?: ErrorMessages[];

  constructor(errorInfo: IDomainException) {
    super(errorInfo.message);
    this.message = errorInfo.message;
    this.code = errorInfo.code;
    this.errorMessages = errorInfo.errorMessages;
  }
}

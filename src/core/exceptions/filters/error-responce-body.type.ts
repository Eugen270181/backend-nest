import { ErrorsMessages } from '../domain-exceptions';
import { DomainExceptionCode } from '../domain-exception-codes';

export interface ErrorResponseBody {
  timestamp: string;
  path: string | null;
  message: string;
  code: DomainExceptionCode;
  errorsMessages?: ErrorsMessages[];
}

export interface DomainErrorResponseBody {
  errorsMessages?: ErrorsMessages[];
}

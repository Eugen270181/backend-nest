import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DomainExceptionCode } from '../core/exceptions/domain-exception-codes';
import {
  DomainException,
  ErrorsMessages,
} from '../core/exceptions/domain-exceptions';
import { ValidationError } from 'class-validator';
import { ObjectIdInParamsValidationPipe } from '../core/pipes/object-id-in-params-validation-pipe.service';

const errorFormatter = (
  errors: ValidationError[],
  errorsMessages: ErrorsMessages[] = [],
  parentName: string = '',
): ErrorsMessages[] | undefined => {
  for (const error of errors) {
    if (!error.constraints && error.children?.length) {
      errorFormatter(
        error.children,
        errorsMessages,
        `${parentName}${error.property}.`,
      );
    } else if (error.constraints) {
      const constrainKeys = Object.keys(error.constraints);

      for (const key of constrainKeys) {
        errorsMessages.push({
          message: error.constraints[key]
            ? `${parentName}${error.constraints[key]}; Received value: ${error?.value || 'undefined'}`
            : '',
          field: error.property,
        });
      }
    }
  }

  // Возвращаем undefined если массив пустой, иначе сам массив
  return errorsMessages.length > 0 ? errorsMessages : undefined;
};

export function pipesSetup(app: INestApplication) {
  //Глобальный пайп для валидации и трансформации входящих данных.
  app.useGlobalPipes(
    new ObjectIdInParamsValidationPipe(),
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const formattedErrors = errorFormatter(errors);

        throw new DomainException({
          code: DomainExceptionCode.ValidationError,
          message: 'Validation failed',
          errorsMessages: formattedErrors,
        });
      },
    }),
  );
}

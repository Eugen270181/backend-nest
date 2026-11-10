// import { isValidObjectId } from 'mongoose'; // Legacy ObjectId support, intentionally disabled.
import { DomainException } from '../exceptions/domain-exceptions';
import {
  ArgumentMetadata,
  Injectable,
  ParseUUIDPipe,
  PipeTransform,
} from '@nestjs/common';
import { DomainExceptionCode } from '../exceptions/domain-exception-codes';

// Legacy pipe name is retained to make a future MongoDB rollback easier.
// PostgreSQL UUID validation is the only active ID validation.
const DEFAULT_CONFIG = {
  // objectIdOrUuidParams: ['id', 'userId'], // Legacy hybrid Mongo/PostgreSQL validation.
  // objectIdParams: ['blogId', 'postId', 'commentId'], // Legacy Mongo ObjectId validation.
  uuidParams: ['id', 'userId', 'blogId', 'postId', 'commentId', 'deviceId'],
  numericParams: ['version', 'page', 'limit'],
};

interface ParamValidationConfig {
  // objectIdOrUuidParams?: string[];
  // objectIdParams?: string[];
  uuidParams?: string[];
  numericParams?: string[];
}

@Injectable()
export class ObjectIdInParamsValidationPipe implements PipeTransform {
  private readonly config: ParamValidationConfig;

  constructor(config?: ParamValidationConfig) {
    this.config = {
      uuidParams: config?.uuidParams ?? DEFAULT_CONFIG.uuidParams,
      numericParams: config?.numericParams ?? DEFAULT_CONFIG.numericParams,
    };
  }

  transform(
    value: string,
    metadata: ArgumentMetadata,
  ): string | Promise<string> {
    if (metadata.type !== 'param' || !metadata.data) return value;

    const paramName = metadata.data;

    // Legacy MongoDB validation, intentionally disabled:
    // if (this.config.objectIdOrUuidParams?.includes(paramName)) {
    //   if (!isValidObjectId(value) && !isUUID(value)) {
    //     throw new DomainException({ ... });
    //   }
    // }
    // if (this.config.objectIdParams?.includes(paramName) && !isValidObjectId(value)) {
    //   throw new DomainException({ ... });
    // }

    if (this.config.uuidParams?.includes(paramName)) {
      return new ParseUUIDPipe({
        version: '4',
        exceptionFactory: () => {
          const message = `Invalid UUID for parameter '${paramName}': ${value}`;
          return new DomainException({
            code: DomainExceptionCode.BadRequest,
            message,
            errorsMessages: [{ message, field: paramName }],
          });
        },
      }).transform(value, metadata);
    }

    if (
      this.config.numericParams?.includes(paramName) &&
      (isNaN(Number(value)) || !Number.isInteger(Number(value)))
    ) {
      const message = `Parameter '${paramName}' must be an integer: ${value}`;
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message,
        errorsMessages: [{ message, field: paramName }],
      });
    }

    return value;
  }
}

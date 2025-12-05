import { isValidObjectId } from 'mongoose';
import { DomainException } from '../exceptions/domain-exceptions';
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { DomainExceptionCode } from '../exceptions/domain-exception-codes';

// Вынесем конфигурацию по умолчанию в отдельный объект
const DEFAULT_CONFIG = {
  objectIdParams: ['id', 'userId', 'blogId', 'postId', 'commentId'],
  numericParams: ['version', 'page', 'limit'],
};

interface ParamValidationConfig {
  objectIdParams?: string[];
  numericParams?: string[];
}

@Injectable()
export class ObjectIdInParamsValidationPipe implements PipeTransform {
  private readonly config: ParamValidationConfig;

  constructor(config?: ParamValidationConfig) {
    this.config = {
      objectIdParams: config?.objectIdParams || DEFAULT_CONFIG.objectIdParams,
      numericParams: config?.numericParams || DEFAULT_CONFIG.numericParams,
    };
  }

  transform(value: string, metadata: ArgumentMetadata): any {
    // Проверяем только параметры
    if (metadata.type !== 'param') return value;
    if (!metadata.data) return value;

    const paramName = metadata.data;

    //console.log(paramName);

    // Проверка ObjectId параметров
    if (this.isObjectIdParam(paramName)) {
      if (!isValidObjectId(value)) {
        const message = `Invalid ObjectId for parameter '${paramName}': ${value}`;
        throw new DomainException({
          code: DomainExceptionCode.BadRequest,
          message,
          errorsMessages: [{ message, field: `${paramName}` }],
        });
      }
    }

    // Проверка числовых параметров
    if (this.isNumericParam(paramName)) {
      if (isNaN(Number(value)) || !Number.isInteger(Number(value))) {
        const message = `Parameter '${paramName}' must be an integer: ${value}`;
        throw new DomainException({
          code: DomainExceptionCode.BadRequest,
          message,
          errorsMessages: [{ message, field: `${paramName}` }],
        });
      }
    }

    return value;
  }

  private isObjectIdParam(paramName: string): boolean {
    return this.config.objectIdParams?.includes(paramName) ?? false;
  }

  private isNumericParam(paramName: string): boolean {
    return this.config.numericParams?.includes(paramName) ?? false;
  }
}

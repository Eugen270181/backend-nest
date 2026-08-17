import { isValidObjectId } from 'mongoose';
import { isUUID } from 'class-validator';
import { DomainException } from '../exceptions/domain-exceptions';
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { DomainExceptionCode } from '../exceptions/domain-exception-codes';

// Вынесем конфигурацию по умолчанию в отдельный объект
const DEFAULT_CONFIG = {
  // Гибридный период миграции на Postgres:
  // 'id' и 'userId' могут указывать и на Mongo-сущность (ObjectId),
  // и на Postgres-сущность (UUID) - принимаем оба формата.
  // Несуществующий id корректного формата даст 404 из репозитория.
  objectIdOrUuidParams: ['id', 'userId'],
  objectIdParams: ['blogId', 'postId', 'commentId'],
  // deviceId генерируется приложением как uuid v4 и в Mongo-времена
  // не был ObjectId, поэтому здесь строго UUID
  uuidParams: ['deviceId'],
  numericParams: ['version', 'page', 'limit'],
};

interface ParamValidationConfig {
  objectIdOrUuidParams?: string[];
  objectIdParams?: string[];
  uuidParams?: string[];
  numericParams?: string[];
}

@Injectable()
export class ObjectIdInParamsValidationPipe implements PipeTransform {
  private readonly config: ParamValidationConfig;

  constructor(config?: ParamValidationConfig) {
    this.config = {
      objectIdOrUuidParams:
        config?.objectIdOrUuidParams || DEFAULT_CONFIG.objectIdOrUuidParams,
      objectIdParams: config?.objectIdParams || DEFAULT_CONFIG.objectIdParams,
      uuidParams: config?.uuidParams || DEFAULT_CONFIG.uuidParams,
      numericParams: config?.numericParams || DEFAULT_CONFIG.numericParams,
    };
  }

  transform(value: string, metadata: ArgumentMetadata): any {
    // Проверяем только параметры
    if (metadata.type !== 'param') return value;
    if (!metadata.data) return value;

    const paramName = metadata.data;

    //console.log(paramName);

    // Проверка ObjectId-или-UUID параметров (гибридный период Mongo + Postgres)
    if (this.isObjectIdOrUuidParam(paramName)) {
      if (!isValidObjectId(value) && !isUUID(value)) {
        const message = `Invalid id for parameter '${paramName}': ${value}`;
        throw new DomainException({
          code: DomainExceptionCode.BadRequest,
          message,
          errorsMessages: [{ message, field: `${paramName}` }],
        });
      }
    }

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

    // Проверка UUID параметров
    if (this.isUuidParam(paramName)) {
      if (!isUUID(value)) {
        const message = `Invalid UUID for parameter '${paramName}': ${value}`;
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

  private isObjectIdOrUuidParam(paramName: string): boolean {
    return this.config.objectIdOrUuidParams?.includes(paramName) ?? false;
  }

  private isObjectIdParam(paramName: string): boolean {
    return this.config.objectIdParams?.includes(paramName) ?? false;
  }

  private isUuidParam(paramName: string): boolean {
    return this.config.uuidParams?.includes(paramName) ?? false;
  }

  private isNumericParam(paramName: string): boolean {
    return this.config.numericParams?.includes(paramName) ?? false;
  }
}

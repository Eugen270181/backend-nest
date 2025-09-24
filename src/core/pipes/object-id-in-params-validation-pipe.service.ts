import { isValidObjectId } from 'mongoose';
import { DomainException } from '../exceptions/domain-exceptions';
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { DomainExceptionCode } from '../exceptions/domain-exception-codes';

// Вынесем конфигурацию по умолчанию в отдельный объект
const DEFAULT_CONFIG = {
  objectIdParams: ['id', 'userId', 'blogId', 'postId', 'commentId'],
  numericParams: ['version', 'page', 'limit'],
  requiredParams: [],
};

interface ParamValidationConfig {
  objectIdParams?: string[];
  numericParams?: string[];
  requiredParams?: string[];
}

@Injectable()
export class ObjectIdInParamsValidationPipe implements PipeTransform {
  private readonly config: ParamValidationConfig;

  constructor(config?: ParamValidationConfig) {
    this.config = {
      objectIdParams: config?.objectIdParams || DEFAULT_CONFIG.objectIdParams,
      numericParams: config?.numericParams || DEFAULT_CONFIG.numericParams,
      requiredParams: config?.requiredParams || DEFAULT_CONFIG.requiredParams,
    };
  }

  transform(value: string, metadata: ArgumentMetadata): any {
    // Проверяем только параметры
    if (metadata.type !== 'param') return value;
    if (!metadata.data) return value;

    const paramName = metadata.data;

    // Проверка обязательных параметров
    if (this.isRequiredParam(paramName) && this.isEmpty(value)) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: `Parameter '${paramName}' is required`,
      });
    }

    // Если значение пустое и параметр не обязательный, пропускаем проверки
    if (this.isEmpty(value)) return value;

    // Проверка ObjectId параметров
    if (this.isObjectIdParam(paramName)) {
      if (!isValidObjectId(value)) {
        throw new DomainException({
          code: DomainExceptionCode.BadRequest,
          message: `Invalid ObjectId for parameter '${paramName}': ${value}`,
        });
      }
    }

    // Проверка числовых параметров
    if (this.isNumericParam(paramName)) {
      if (isNaN(Number(value)) || !Number.isInteger(Number(value))) {
        throw new DomainException({
          code: DomainExceptionCode.BadRequest,
          message: `Parameter '${paramName}' must be an integer: ${value}`,
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

  private isRequiredParam(paramName: string): boolean {
    return this.config.requiredParams?.includes(paramName) ?? false;
  }

  private isEmpty(value: any): boolean {
    return value === undefined || value === null || value === '';
  }
}

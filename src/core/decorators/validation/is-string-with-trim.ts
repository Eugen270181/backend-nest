import { applyDecorators } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { Trim } from '../transform/trim';

// Объединение декораторов
// https://docs.nestjs.com/custom-decorators#decorator-composition
// interface StringWithTrimOptions {
//   minLength?: number;
//   maxLength?: number;
// }

export const IsStringWithTrim = ({
  minLength = 1,
  maxLength,
}: {
  minLength?: number;
  maxLength?: number;
}) => {
  //const { minLength = 0, maxLength } = options;
  const decorators = [
    Trim(),
    IsString(),
    maxLength !== undefined ? Length(minLength, maxLength) : Length(minLength),
  ];

  return applyDecorators(...decorators);
};

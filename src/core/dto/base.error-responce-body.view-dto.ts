import { ApiProperty } from '@nestjs/swagger';
import { DomainExceptionCode } from '../exceptions/domain-exception-codes';

// DTO для описания структуры errorMessages
export class ErrorMessageDto {
  // @ApiProperty({
  //   example: 'Email is required',
  //   description: 'Error message for specific field',
  // })
  message: string;

  // @ApiProperty({
  //   example: 'email',
  //   description: 'Field name where error occurred',
  // })
  field: string;
}

// DTO для полного ответа об ошибке
export class ErrorResponseBodyDto {
  // @ApiProperty({
  //   example: '2024-01-01T00:00:00.000Z',
  //   description: 'Timestamp when error occurred',
  // })
  timestamp: string;

  // @ApiProperty({
  //   example: '/api/users/123',
  //   description: 'Request path where error occurred',
  // })
  path: string | null;

  // @ApiProperty({
  //   example: 'User not found',
  //   description: 'Error message',
  // })
  message: string;

  // @ApiProperty({
  //   example: 'NotFound',
  //   description: 'Domain exception code',
  //   enum: DomainExceptionCode,
  // })
  code: DomainExceptionCode;

  // @ApiProperty({
  //   type: [ErrorMessageDto], // Массив вложенных объектов
  //   description: 'Additional error details for validation errors',
  //   example: [
  //     {
  //       message: 'Email is required',
  //       field: 'email',
  //     },
  //     {
  //       message: 'Password must be at least 8 characters',
  //       field: 'password',
  //     },
  //   ],
  //   required: false,
  // })
  errorMessages?: ErrorMessageDto[];
}

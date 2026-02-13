import { OptionalJwtMiddleware } from './optional-jwt.middleware';
import { applyDecorators, UseGuards } from '@nestjs/common';

export function UseOptionalAuth() {
  return applyDecorators(UseGuards(OptionalJwtMiddleware));
}

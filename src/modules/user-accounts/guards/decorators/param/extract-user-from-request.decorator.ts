import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserContextDto } from '../../dto/user-context.dto';
//for jwt middleware, user may be null! it's for get requests
export const ExtractUserFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserContextDto | null => {
    const request = context.switchToHttp().getRequest();

    const user: UserContextDto | null = request.user;

    return user;
  },
);
//for jwtguard, user must be defined!
export const ExtractUserIdFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();

    const user: UserContextDto | null = request.user;

    if (!user) {
      throw new InternalServerErrorException();
    }

    return user.id;
  },
);

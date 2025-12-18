import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { NextFunction } from 'express';
import { ExtractJwt } from 'passport-jwt';
import { AuthValidationService } from '../application/auth-validation.service';

@Injectable()
export class OptionalJwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authValidationService: AuthValidationService,
  ) {}

  async use(
    req: Request & { user?: UserContextDto | null },
    res: Response,
    next: NextFunction,
  ) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const payload: UserContextDto = await this.jwtService.verifyAsync(token);
      const user = await this.authValidationService.validateUserById(
        payload.id,
      );
      req.user = user || null; // null если пользователь не найден
    } catch {
      req.user = null; // битый/протухший токен
    }

    next();
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { appConfig } from '../../../core/settings/config';
import { UsersService } from '../application/users.service';
import { AuthService } from '../application/auth.service';
import { AuthQueryRepository } from '../infrastructure/query/auth.query-repository';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UserId } from '../guards/decorators/param/extract-user-from-request.decorator';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { MeViewDto } from './view-dto/user.view-dto';
import { AuthQueryService } from '../application/query/auth.query-service';
import { CreateUserInputDto } from './input-dto/create-users.input-dto';
import { AuthViewDto } from './view-dto/auth.view-dto';
import { EmailInputDto } from './input-dto/email.input-dto';
import { ConfirmRegInputDto } from './input-dto/confirm-reg.input-dto';
import { ConfirmPassInputDto } from './input-dto/confirm-pass.input-dto';

@UseGuards(ThrottlerGuard)
// @Throttle({ default: { limit: 5, ttl: 10000 } })
@Controller('auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private authQueryRepository: AuthQueryRepository,
    private authQueryService: AuthQueryService,
  ) {
    if (appConfig.IOC_LOG) console.log('AuthController created');
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('registration')
  registration(@Body() body: CreateUserInputDto): Promise<void> {
    return this.authService.registerUser(body);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('registration-email-resending')
  regEmailResending(@Body() body: EmailInputDto): Promise<void> {
    return this.authService.regEmailResending(body);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('registration-confirmation')
  regConfirm(@Body() body: ConfirmRegInputDto): Promise<void> {
    return this.authService.regConfirm(body);
  }

  @SkipThrottle()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  //swagger doc
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        loginOrEmail: { type: 'string', example: 'login123' },
        password: { type: 'string', example: 'superpassword' },
      },
    },
  })
  async login(
    /*@Request() req: any*/
    @UserId() userId: string,
  ): Promise<AuthViewDto> {
    console.log('auth.login controller');
    return this.authService.login(userId);
  }

  @SkipThrottle()
  @ApiBearerAuth()
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@UserId() userId: string): Promise<MeViewDto> {
    console.log('auth.me controller');
    return this.authQueryService.getMeViewDtoOrFail(userId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('password-recovery')
  passRecovery(@Body() body: EmailInputDto): Promise<void> {
    return this.authService.passRecovery(body);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('new-password')
  passConfirm(@Body() body: ConfirmPassInputDto): Promise<void> {
    return this.authService.passConfirm(body);
  }

  //добавлено для примера, когда кастомный гард пропускает, даже если пользователь не авторизован и не найден
  // @ApiBearerAuth()
  // @Get('me-or-default')
  // @UseGuards(JwtOptionalAuthGuard)
  // async meOrDefault(
  //   @ExtractUserIfExistsFromRequest() user: UserContextDto,
  // ): Promise<Nullable<MeViewDto>> {
  //   if (user) {
  //     return this.authQueryService.getMeViewDtoOrFail(user.id);
  //   } else {
  //     return {
  //       userId: null,
  //       login: 'anonymous',
  //       email: null,
  //     };
  //   }
  // }
}

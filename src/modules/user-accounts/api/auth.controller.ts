import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { appConfig } from '../../../core/settings/config';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import {
  DeviceId,
  UserId,
} from '../guards/decorators/param/extract-user-from-request.decorator';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { CreateUserInputDto } from './input-dto/create-users.input-dto';
import { TokenViewDto } from './view-dto/token.view-dto';
import { EmailInputDto } from './input-dto/email.input-dto';
import { ConfirmRegInputDto } from './input-dto/confirm-reg.input-dto';
import { ConfirmPassInputDto } from './input-dto/confirm-pass.input-dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { LoginUserCommand } from '../application/usecases/login-user.usecase';
import { RegisterUserCommand } from '../application/usecases/users/register-user.usecase';
import { ResendRegistrationCodeUserCommand } from '../application/usecases/users/resend-registration-code-user.usecase';
import { ConfirmRegistrationCodeUserCommand } from '../application/usecases/users/confirm-registration-code-user.usecase';
import { RecoveryPasswordUserCommand } from '../application/usecases/users/recovery-password-user.usecase';
import { ConfirmPasswordUserCommand } from '../application/usecases/users/confirm-password-user.usecase';
import { GetMeQuery } from '../application/queries/get-me.query';
import { MeViewDto } from './view-dto/me.view-dto';
import { TokensDto } from '../application/dto/tokens.dto';
import { JwtRefreshAuthGuard } from '../guards/bearer/jwt-refresh-auth.guard';
import { RefreshTokensCommand } from '../application/usecases/refresh-tokens.usecase';
import { DeleteUserSessionByIdCommand } from '../application/usecases/sessions/delete-user-session-by-id-use.case';

@UseGuards(ThrottlerGuard)
// @Throttle({ default: { limit: 5, ttl: 10000 } })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    if (appConfig.IOC_LOG) console.log('AuthController created');
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('registration')
  registration(@Body() body: CreateUserInputDto): Promise<void> {
    return this.commandBus.execute<RegisterUserCommand, void>(
      new RegisterUserCommand(body),
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('registration-email-resending')
  regEmailResending(@Body() body: EmailInputDto): Promise<void> {
    return this.commandBus.execute<ResendRegistrationCodeUserCommand>(
      new ResendRegistrationCodeUserCommand(body),
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('registration-confirmation')
  regConfirm(@Body() body: ConfirmRegInputDto): Promise<void> {
    return this.commandBus.execute<ConfirmRegistrationCodeUserCommand>(
      new ConfirmRegistrationCodeUserCommand(body),
    );
  }
  //////////////////////////LOGIN_REGRESH_ABOUTME_LOGOUT//////////////
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @Post('login')
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
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<TokenViewDto> {
    const ip = ((req.headers['x-forwarded-for'] as string)
      ?.split(',')[0]
      ?.trim() || req.ip) as string;
    const title =
      (req.headers['user-agent'] as string)?.slice(0, 100) || 'Unknown';

    const tokensDto = await this.commandBus.execute<
      LoginUserCommand,
      TokensDto
    >(new LoginUserCommand(userId, ip, title));

    res.cookie('refreshToken', tokensDto.refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return { accessToken: tokensDto.accessToken };
  }

  @SkipThrottle()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh-token')
  async refreshToken /*@Request() req: any*/(
    @UserId() userId: string,
    @DeviceId() deviceId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokensDto = await this.commandBus.execute<
      RefreshTokensCommand,
      TokensDto
    >(new RefreshTokensCommand(deviceId, userId));

    res.cookie('refreshToken', tokensDto.refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return { accessToken: tokensDto.accessToken };
  } // @Res({ passthrough: true }) res: Response, // @UserId() userId: string,

  @SkipThrottle()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtRefreshAuthGuard)
  @Post('logout')
  async logout(@UserId() userId: string, @DeviceId() deviceId: string) {
    await this.commandBus.execute<DeleteUserSessionByIdCommand, boolean>(
      new DeleteUserSessionByIdCommand(deviceId, userId),
    );
  }

  @SkipThrottle()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@UserId() userId: string): Promise<MeViewDto> {
    return this.queryBus.execute<GetMeQuery, MeViewDto>(new GetMeQuery(userId));
  }
  //////////////////////////USER_PASSWORD_ACTION/////////////////////
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('password-recovery')
  passRecovery(@Body() body: EmailInputDto): Promise<void> {
    return this.commandBus.execute<RecoveryPasswordUserCommand, void>(
      new RecoveryPasswordUserCommand(body),
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('new-password')
  passConfirm(@Body() body: ConfirmPassInputDto): Promise<void> {
    return this.commandBus.execute<ConfirmPasswordUserCommand, void>(
      new ConfirmPasswordUserCommand(body),
    );
  }
}

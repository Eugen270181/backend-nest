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
import { ThrottlerGuard } from '@nestjs/throttler';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import {
  DeviceId,
  TokenVersion,
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
import { LogoutUserCommand } from '../application/usecases/logout-user.usecase';
import { CoreConfig } from '../../../core/core.config';

// Apply the configured per-route rate limit to registration, login and recovery operations.
@Controller('auth')
export class AuthController {
  constructor(
    private coreConfig: CoreConfig,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('AuthController created');
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('registration')
  @UseGuards(ThrottlerGuard)
  registration(@Body() body: CreateUserInputDto): Promise<void> {
    return this.commandBus.execute<RegisterUserCommand, void>(
      new RegisterUserCommand(body),
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('registration-email-resending')
  @UseGuards(ThrottlerGuard)
  regEmailResending(@Body() body: EmailInputDto): Promise<void> {
    return this.commandBus.execute<ResendRegistrationCodeUserCommand>(
      new ResendRegistrationCodeUserCommand(body),
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('registration-confirmation')
  @UseGuards(ThrottlerGuard)
  regConfirm(@Body() body: ConfirmRegInputDto): Promise<void> {
    return this.commandBus.execute<ConfirmRegistrationCodeUserCommand>(
      new ConfirmRegistrationCodeUserCommand(body),
    );
  }
  //////////////////////////LOGIN_REGRESH_ABOUTME_LOGOUT//////////////
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseGuards(ThrottlerGuard, LocalAuthGuard)
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
    // Express resolves req.ip using only the explicitly trusted proxy hops.
    // Do not trust a client-supplied X-Forwarded-For header directly.
    const ip = req.ip || 'unknown';
    const title =
      (req.headers['user-agent'] as string)?.slice(0, 100) || 'Unknown';

    const tokensDto = await this.commandBus.execute<
      LoginUserCommand,
      TokensDto
    >(new LoginUserCommand(userId, ip, title));

    res.cookie(
      'refreshToken',
      tokensDto.refreshToken,
      this.refreshCookieOptions(),
    );

    return { accessToken: tokensDto.accessToken };
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh-token')
  async refreshToken /*@Request() req: any*/(
    @UserId() userId: string,
    @DeviceId() deviceId: string,
    @TokenVersion() tokenVersion: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokensDto = await this.commandBus.execute<
      RefreshTokensCommand,
      TokensDto
    >(new RefreshTokensCommand(deviceId, userId, tokenVersion));

    res.cookie(
      'refreshToken',
      tokensDto.refreshToken,
      this.refreshCookieOptions(),
    );

    return { accessToken: tokensDto.accessToken };
  } // @Res({ passthrough: true }) res: Response, // @UserId() userId: string,

  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtRefreshAuthGuard)
  @Post('logout')
  async logout(
    @UserId() userId: string,
    @DeviceId() deviceId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.commandBus.execute<LogoutUserCommand, boolean>(
      new LogoutUserCommand(deviceId, userId),
    );
    res.clearCookie('refreshToken', this.refreshCookieOptions());
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@UserId() userId: string): Promise<MeViewDto> {
    return this.queryBus.execute<GetMeQuery, MeViewDto>(new GetMeQuery(userId));
  }
  //////////////////////////USER_PASSWORD_ACTION/////////////////////
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('password-recovery')
  @UseGuards(ThrottlerGuard)
  passRecovery(@Body() body: EmailInputDto): Promise<void> {
    return this.commandBus.execute<RecoveryPasswordUserCommand, void>(
      new RecoveryPasswordUserCommand(body),
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('new-password')
  @UseGuards(ThrottlerGuard)
  async passConfirm(
    @Body() body: ConfirmPassInputDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.commandBus.execute<ConfirmPasswordUserCommand, void>(
      new ConfirmPasswordUserCommand(body),
    );
    // Clear any stale refresh cookie on the device initiating password recovery.
    res.clearCookie('refreshToken', this.refreshCookieOptions());
  }

  private refreshCookieOptions() {
    return {
      httpOnly: true,
      // HTTPS is mandatory in staging/production; keep local HTTP and e2e tests usable.
      secure: ['staging', 'production'].includes(this.coreConfig.node_env),
      sameSite: 'lax' as const,
      path: '/',
    };
  }
}

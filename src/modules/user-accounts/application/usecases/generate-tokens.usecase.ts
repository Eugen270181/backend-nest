import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { appConfig } from '../../../../core/settings/config';
import {
  ACCESS_TOKEN_SERVICE,
  REFRESH_TOKEN_SERVICE,
} from '../../guards/tokens.constants';
import { Inject } from '@nestjs/common';
import { TokensWithTimesDto } from '../dto/tokens-with-times.dto';

export interface RefreshJwtPayload {
  iat: number;
  exp: number;
  userId: string;
  deviceId: string;
}

export class GenerateTokensCommand {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
  ) {}
}

@CommandHandler(GenerateTokensCommand)
export class GenerateTokensUseCase
  implements ICommandHandler<GenerateTokensCommand, TokensWithTimesDto>
{
  constructor(
    @Inject(ACCESS_TOKEN_SERVICE)
    private readonly accessTokenService: JwtService,
    @Inject(REFRESH_TOKEN_SERVICE)
    private readonly refreshTokenService: JwtService,
  ) {
    if (appConfig.IOC_LOG) console.log('GenerateTokensUseCase created');
  }

  async execute({
    userId,
    deviceId,
  }: GenerateTokensCommand): Promise<TokensWithTimesDto> {
    const [accessToken, refreshToken] = await Promise.all([
      this.accessTokenService.signAsync({ userId }),
      this.refreshTokenService.signAsync({ userId, deviceId }),
    ]);

    if (!accessToken || !refreshToken) {
      throw new Error('Something wrong with generate tokens, try later');
    }

    //записываем дату создания RT по user в соответ объект соотв коллекции бд
    const jwtPayload: RefreshJwtPayload =
      this.refreshTokenService.decode(refreshToken);

    return {
      accessToken,
      refreshToken,
      lastActiveDate: new Date(jwtPayload.iat * 1000),
      expDate: new Date(jwtPayload.exp * 1000),
    };
  }
}

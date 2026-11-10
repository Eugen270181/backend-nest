import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TokensDto } from '../dto/tokens.dto';
import { GenerateTokensCommand } from './generate-tokens.usecase';
import { TokensWithTimesDto } from '../dto/tokens-with-times.dto';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { CoreConfig } from '../../../../core/core.config';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class RefreshTokensCommand {
  constructor(
    public readonly deviceId: string,
    public readonly userId: string,
    public readonly tokenVersion: string,
  ) {}
}

@CommandHandler(RefreshTokensCommand)
export class RefreshTokensUseCase
  implements ICommandHandler<RefreshTokensCommand, TokensDto>
{
  constructor(
    private coreConfig: CoreConfig,
    private sessionsRepository: SessionsRepository,
    private commandBus: CommandBus,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('RefreshTokensUseCase created');
  }

  async execute({
    deviceId,
    userId,
    tokenVersion,
  }: RefreshTokensCommand): Promise<TokensDto> {
    // //генерируем новую пару токенов
    // //обновляем запись сессии по полю lastActiveDate и expDate
    const newTokensData: TokensWithTimesDto = await this.commandBus.execute<
      GenerateTokensCommand,
      TokensWithTimesDto
    >(new GenerateTokensCommand(userId, deviceId));

    // Rotate only the exact token version that passed the guard.
    // UPDATE ... WHERE version = oldVersion prevents replay and cannot recreate a deleted session.
    const rotated = await this.sessionsRepository.rotateSessionToken(
      deviceId,
      userId,
      tokenVersion,
      newTokensData.tokenVersion,
      newTokensData.lastActiveDate,
      newTokensData.expDate,
    );

    if (!rotated) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Refresh token was already used or its session was revoked.',
      });
    }

    // 5. Вернуть только токены (RT в cookie)
    return {
      accessToken: newTokensData.accessToken,
      refreshToken: newTokensData.refreshToken,
    };
  }
}

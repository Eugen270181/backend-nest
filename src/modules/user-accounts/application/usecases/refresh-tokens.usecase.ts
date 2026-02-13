import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TokensDto } from '../dto/tokens.dto';
import { appConfig } from '../../../../core/settings/config';
import { GenerateTokensCommand } from './generate-tokens.usecase';
import { TokensWithTimesDto } from '../dto/tokens-with-times.dto';
import { SessionsRepository } from '../../infrastructure/sessions.repository';

export class RefreshTokensCommand {
  constructor(
    public readonly deviceId: string,
    public readonly userId: string,
  ) {}
}

@CommandHandler(RefreshTokensCommand)
export class RefreshTokensUseCase
  implements ICommandHandler<RefreshTokensCommand, TokensDto>
{
  constructor(
    private sessionsRepository: SessionsRepository,
    private commandBus: CommandBus,
  ) {
    if (appConfig.IOC_LOG) console.log('RefreshTokensUseCase created');
  }

  async execute({
    deviceId,
    userId,
  }: RefreshTokensCommand): Promise<TokensDto> {
    // //генерируем новую пару токенов
    // //обновляем запись сессии по полю lastActiveDate и expDate
    const newTokensData: TokensWithTimesDto = await this.commandBus.execute<
      GenerateTokensCommand,
      TokensWithTimesDto
    >(new GenerateTokensCommand(deviceId, userId));

    // 2. Найти сессию по deviceId (Guard прошёл = точно есть!)
    const sessionDocument =
      await this.sessionsRepository.findSessionById(deviceId);
    if (!sessionDocument) {
      throw new Error('Session not found after token generation'); //хотя перед этим была проверена в гарде по deviceId
    }

    // 3. Обновить через domain method
    sessionDocument.updateSession({
      lastActiveDate: newTokensData.lastActiveDate,
      expDate: newTokensData.expDate,
    });

    // 4. Сохранить (atomic!)
    await this.sessionsRepository.save(sessionDocument);

    // 5. Вернуть только токены (RT в cookie)
    return {
      accessToken: newTokensData.accessToken,
      refreshToken: newTokensData.refreshToken,
    };
  }
}

import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../core/settings/config';
import { TokensDto } from '../dto/tokens.dto';
import { randomUUID } from 'crypto';
import { GenerateTokensCommand } from './generate-tokens.usecase';
import { CreateSessionCommand } from './sessions/create-session.usecase';
import { CreateSessionDto } from '../dto/create-session.dto';
import { TokensWithTimesDto } from '../dto/tokens-with-times.dto';

export class LoginUserCommand {
  constructor(
    public readonly userId: string,
    public readonly ip: string,
    public readonly title: string,
  ) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase
  implements ICommandHandler<LoginUserCommand, TokensDto>
{
  constructor(private readonly commandBus: CommandBus) {
    if (appConfig.IOC_LOG) console.log('LoginUserUseCase created');
  }

  async execute({ userId, ip, title }: LoginUserCommand): Promise<TokensDto> {
    const deviceId = randomUUID(); //todo
    const jwtData = await this.commandBus.execute<
      GenerateTokensCommand,
      TokensWithTimesDto
    >(new GenerateTokensCommand(userId, deviceId));

    const createSessionDto: CreateSessionDto = {
      deviceId,
      userId,
      ip,
      title,
      lastActiveDate: jwtData.lastActiveDate,
      expDate: jwtData.expDate,
    };

    await this.commandBus.execute<CreateSessionCommand, string>(
      new CreateSessionCommand(createSessionDto),
    );

    return {
      accessToken: jwtData.accessToken,
      refreshToken: jwtData.refreshToken,
    };
  }
}

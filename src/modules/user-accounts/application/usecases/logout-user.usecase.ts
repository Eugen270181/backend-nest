import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../core/settings/config';

export class LogoutUserCommand {
  constructor(public readonly deviceId: string) {}
}

@CommandHandler(LogoutUserCommand)
export class LogoutUserUseCase implements ICommandHandler<LogoutUserCommand> {
  constructor(private commandBus: CommandBus) {
    if (appConfig.IOC_LOG) console.log('LogoutUserUseCase created');
  }

  async execute({ deviceId }: LogoutUserCommand) {
    // // 1. Удаляем конкретную сессию (как Express)
    // const isDeleted = await this.sessionsRepo.deleteUserSessionById(
    //   deviceId,
    //   userId,
    // );
    //
    // if (!isDeleted) {
    //   throw new DomainException({
    //     code: DomainExceptionCode.BadRequest,
    //     message: 'Session not found or already deleted',
    //     field: 'deviceId',
    //   });
    // }
  }
}

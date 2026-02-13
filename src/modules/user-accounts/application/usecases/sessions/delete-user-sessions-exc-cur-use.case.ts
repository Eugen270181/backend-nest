import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../../core/settings/config';
import { SessionsRepository } from '../../../infrastructure/sessions.repository';

export class DeleteUserSessionsExcCurCommand {
  constructor(
    public readonly deviceId: string,
    public readonly userId: string,
  ) {}
}

@CommandHandler(DeleteUserSessionsExcCurCommand)
export class DeleteUserSessionsExcCurUseCase
  implements ICommandHandler<DeleteUserSessionsExcCurCommand, boolean>
{
  constructor(private readonly sessionsRepository: SessionsRepository) {
    if (appConfig.IOC_LOG) console.log('DeleteSessionsUseCase created');
  }

  async execute({ deviceId, userId }: DeleteUserSessionsExcCurCommand) {
    return this.sessionsRepository.DeleteUserSessionsExcCur(deviceId, userId);
  }
}

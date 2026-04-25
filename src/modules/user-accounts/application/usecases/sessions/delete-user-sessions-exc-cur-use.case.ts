import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../../infrastructure/sessions.repository';
import { CoreConfig } from '../../../../../core/core.config';

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
  constructor(
    private coreConfig: CoreConfig,
    private readonly sessionsRepository: SessionsRepository,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('DeleteSessionsUseCase created');
  }

  async execute({ deviceId, userId }: DeleteUserSessionsExcCurCommand) {
    return this.sessionsRepository.DeleteUserSessionsExcCur(deviceId, userId);
  }
}

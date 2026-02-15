import { Inject, Logger } from '@nestjs/common'; // Inject из @nestjs/common!

import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class LogoutUserCommand {
  constructor(
    public readonly deviceId: string,
    public readonly userId: string,
  ) {}
}

@CommandHandler(LogoutUserCommand)
export class LogoutUserUseCase implements ICommandHandler<LogoutUserCommand> {
  private readonly logger = new Logger(LogoutUserUseCase.name);
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async execute({ deviceId, userId }: LogoutUserCommand) {
    const isDeleted = await this.sessionsRepository.deleteUserSessionById(
      deviceId,
      userId,
    );

    if (!isDeleted) {
      // ✅ Template string — TS happy!
      this.logger.warn(
        `Logout: session ${deviceId} already deleted for user ${userId}`,
      );
      return;
    }

    this.logger.log(`Logout success for user ${userId}, device ${deviceId}`);
  }
}

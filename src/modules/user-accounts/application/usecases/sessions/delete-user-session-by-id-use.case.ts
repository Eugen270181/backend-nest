import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { SessionsRepository } from '../../../infrastructure/sessions.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

import { GetSessionDocumentQuery } from '../../queries/get-session-document.query';
import { SessionDocument } from '../../../domain/session.entity';
import { CoreConfig } from '../../../../../core/core.config';

export class DeleteUserSessionByIdCommand {
  constructor(
    public readonly deviceId: string,
    public readonly userId: string,
  ) {}
}

@CommandHandler(DeleteUserSessionByIdCommand)
export class DeleteUserSessionByIdUseCase
  implements ICommandHandler<DeleteUserSessionByIdCommand, boolean>
{
  constructor(
    private coreConfig: CoreConfig,
    private readonly sessionsRepository: SessionsRepository,
    private readonly queryBus: QueryBus,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('DeleteSessionUseCase created');
  }

  async execute({ deviceId, userId }: DeleteUserSessionByIdCommand) {
    const sessionDocument: SessionDocument = await this.queryBus.execute<
      GetSessionDocumentQuery,
      SessionDocument
    >(new GetSessionDocumentQuery(deviceId)); //404

    if (sessionDocument.userId !== userId) {
      //403
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: `Actions with session - ${deviceId} denied for user - ${userId}`,
      });
    }

    return await this.sessionsRepository.deleteUserSessionById(
      deviceId,
      userId,
    );
  }
}

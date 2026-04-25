import { CreateSessionDto } from '../../dto/create-session.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Session, SessionModelType } from '../../../domain/session.entity';
import { SessionsRepository } from '../../../infrastructure/sessions.repository';
import { CoreConfig } from '../../../../../core/core.config';

export class CreateSessionCommand {
  constructor(public readonly dto: CreateSessionDto) {}
}

@CommandHandler(CreateSessionCommand)
export class CreateSessionUseCase
  implements ICommandHandler<CreateSessionCommand, string>
{
  constructor(
    private coreConfig: CoreConfig,
    @InjectModel(Session.name)
    private readonly SessionModel: SessionModelType,
    private readonly sessionsRepository: SessionsRepository,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('CreateSessionUseCase created');
  }

  async execute({ dto }: CreateSessionCommand): Promise<string> {
    const sessionDocument = this.SessionModel.createSessionDocument(dto);

    await this.sessionsRepository.save(sessionDocument);

    return sessionDocument._id.toString();
  }
}

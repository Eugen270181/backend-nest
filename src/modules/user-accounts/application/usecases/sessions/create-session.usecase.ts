import { CreateSessionDto } from '../../dto/create-session.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../../core/settings/config';
import { InjectModel } from '@nestjs/mongoose';
import { Session, SessionModelType } from '../../../domain/session.entity';
import { SessionsRepository } from '../../../infrastructure/sessions.repository';

export class CreateSessionCommand {
  constructor(public readonly dto: CreateSessionDto) {}
}

@CommandHandler(CreateSessionCommand)
export class CreateSessionUseCase
  implements ICommandHandler<CreateSessionCommand, string>
{
  constructor(
    @InjectModel(Session.name)
    private readonly SessionModel: SessionModelType,
    private readonly sessionsRepository: SessionsRepository,
  ) {
    if (appConfig.IOC_LOG) console.log('CreateSessionUseCase created');
  }

  async execute({ dto }: CreateSessionCommand): Promise<string> {
    const sessionDocument = this.SessionModel.createSessionDocument(dto);

    await this.sessionsRepository.save(sessionDocument);

    return sessionDocument._id.toString();
  }
}

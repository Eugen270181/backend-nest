import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersFactory } from '../../factories/users.factory';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { appConfig } from '../../../../../core/settings/config';

export class UpdateSessionCommand {
  constructor(public readonly dto: string) {}
}

@CommandHandler(UpdateSessionCommand)
export class UpdateSessionUseCase
  implements ICommandHandler<UpdateSessionCommand>
{
  constructor(
    private readonly usersFactory: UsersFactory,
    private readonly usersRepository: UsersRepository,
  ) {
    if (appConfig.IOC_LOG) console.log('UpdateSessionUseCase created');
  }

  async execute({ dto }: UpdateSessionCommand) {}
}

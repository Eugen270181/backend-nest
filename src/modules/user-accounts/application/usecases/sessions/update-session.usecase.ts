import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersFactory } from '../../factories/users.factory';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { CoreConfig } from '../../../../../core/core.config';

export class UpdateSessionCommand {
  constructor(public readonly dto: string) {}
}

@CommandHandler(UpdateSessionCommand)
export class UpdateSessionUseCase
  implements ICommandHandler<UpdateSessionCommand>
{
  constructor(
    private coreConfig: CoreConfig,
    private readonly usersFactory: UsersFactory,
    private readonly usersRepository: UsersRepository,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('UpdateSessionUseCase created');
  }

  async execute({ dto }: UpdateSessionCommand) {}
}

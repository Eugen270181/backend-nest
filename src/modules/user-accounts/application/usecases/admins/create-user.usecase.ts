import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UsersFactory } from '../../factories/users.factory';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { CoreConfig } from '../../../../../core/core.config';

export class CreateUserCommand {
  constructor(public readonly dto: CreateUserDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase
  implements ICommandHandler<CreateUserCommand, string>
{
  constructor(
    private coreConfig: CoreConfig,
    private readonly usersFactory: UsersFactory,
    private readonly usersRepository: UsersRepository,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('CreateUserUseCase created');
  }

  async execute({ dto }: CreateUserCommand): Promise<string> {
    const userDocument = await this.usersFactory.createUserBySa(dto);

    await this.usersRepository.save(userDocument);

    return userDocument._id.toString();
  }
}

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../../core/settings/config';
import { CreateUserDto } from '../../dto/user.dto';
import { UsersFactory } from '../../factories/users.factory';

export class CreateUserCommand {
  constructor(public readonly dto: CreateUserDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase
  implements ICommandHandler<CreateUserCommand, string>
{
  constructor(private readonly usersFactory: UsersFactory) {
    if (appConfig.IOC_LOG) console.log('CreateUserUseCase created');
  }

  async execute({ dto }: CreateUserCommand): Promise<string> {
    const userDocument = await this.usersFactory.createUserBySa(dto);

    return userDocument._id.toString();
  }
}

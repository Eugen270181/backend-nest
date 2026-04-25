import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../infrastructure/users.repository';

import { UserValidationService } from '../../services/user-validation.service';
import { UserSearchType } from '../../dto/enum/user-search-type';
import { CoreConfig } from '../../../../../core/core.config';

export class DeleteUserCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase
  implements ICommandHandler<DeleteUserCommand, void>
{
  constructor(
    private coreConfig: CoreConfig,
    private readonly usersRepository: UsersRepository,
    private readonly userValidationService: UserValidationService,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('DeleteUserUseCase created');
  }

  async execute({ id }: DeleteUserCommand): Promise<void> {
    await this.userValidationService.ensureUserExists(UserSearchType.Id, id);

    await this.usersRepository.deleteUserById(id);
  }
}

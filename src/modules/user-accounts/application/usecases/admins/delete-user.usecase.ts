import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../infrastructure/users.repository';

import { UserValidationService } from '../../user-validation.service';
import { UserSearchType } from '../../dto/enum/user-search-type';
import { appConfig } from '../../../../../core/settings/config';

export class DeleteUserCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase
  implements ICommandHandler<DeleteUserCommand, void>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userValidationService: UserValidationService,
  ) {
    if (appConfig.IOC_LOG) console.log('DeleteUserUseCase created');
  }

  async execute({ id }: DeleteUserCommand): Promise<void> {
    await this.userValidationService.ensureUserExists(UserSearchType.Id, id);

    await this.usersRepository.deleteUserById(id);
  }
}

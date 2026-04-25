import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserSearchType } from '../../dto/enum/user-search-type';
import { UserValidationService } from '../../services/user-validation.service';
import { UserDocument } from '../../../domain/user.entity';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { ConfirmRegInputDto } from '../../../api/input-dto/confirm-reg.input-dto';
import { CoreConfig } from '../../../../../core/core.config';

export class ConfirmRegistrationCodeUserCommand {
  constructor(public readonly dto: ConfirmRegInputDto) {}
}

@CommandHandler(ConfirmRegistrationCodeUserCommand)
export class ConfirmRegistrationCodeUseCase
  implements ICommandHandler<ConfirmRegistrationCodeUserCommand>
{
  constructor(
    private coreConfig: CoreConfig,
    private readonly usersRepository: UsersRepository,
    private readonly userValidationService: UserValidationService,
  ) {
    if (this.coreConfig.IOC_LOG)
      console.log('ConfirmRegistrationCodeUseCase created');
  }

  async execute({ dto }: ConfirmRegistrationCodeUserCommand) {
    const foundUser: UserDocument =
      await this.userValidationService.ensureUserExistsNotExpiredNotConfirmed(
        UserSearchType.RegConfirmCode,
        dto.code,
      );

    foundUser.setUserConfirmation();

    await this.usersRepository.save(foundUser);
  }
}

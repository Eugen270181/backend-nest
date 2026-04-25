import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserSearchType } from '../../dto/enum/user-search-type';
import { UserValidationService } from '../../services/user-validation.service';
import { UserDocument } from '../../../domain/user.entity';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { ConfirmPassDto } from '../../dto/confirm-pass.dto';
import { CryptoService } from '../../services/crypto.service';
import { CoreConfig } from '../../../../../core/core.config';

export class ConfirmPasswordUserCommand {
  constructor(public readonly dto: ConfirmPassDto) {}
}

@CommandHandler(ConfirmPasswordUserCommand)
export class ConfirmPasswordUseCase
  implements ICommandHandler<ConfirmPasswordUserCommand, void>
{
  constructor(
    private coreConfig: CoreConfig,
    private readonly usersRepository: UsersRepository,
    private readonly userValidationService: UserValidationService,
    private readonly cryptoService: CryptoService,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('ConfirmPasswordUseCase created');
  }

  async execute({ dto }: ConfirmPasswordUserCommand) {
    const foundUser: UserDocument =
      await this.userValidationService.ensureUserExistsNotExpired(
        UserSearchType.PassConfirmCode,
        dto.recoveryCode,
      );

    const newPasswordHash = await this.cryptoService.getHash(dto.newPassword);
    foundUser.updatePassHash(newPasswordHash);

    await this.usersRepository.save(foundUser);
  }
}

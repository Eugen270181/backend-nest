import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../../core/settings/config';
import { UserSearchType } from '../../dto/enum/user-search-type';
import { UserValidationService } from '../../services/user-validation.service';
import { UserDocument } from '../../../domain/user.entity';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { ConfirmPassDto } from '../../dto/confirm-pass.dto';
import { CryptoService } from '../../services/crypto.service';

export class ConfirmPasswordUserCommand {
  constructor(public readonly dto: ConfirmPassDto) {}
}

@CommandHandler(ConfirmPasswordUserCommand)
export class ConfirmPasswordUseCase
  implements ICommandHandler<ConfirmPasswordUserCommand, void>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userValidationService: UserValidationService,
    private readonly cryptoService: CryptoService,
  ) {
    if (appConfig.IOC_LOG) console.log('ConfirmPasswordUseCase created');
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

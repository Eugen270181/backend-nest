import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserSearchType } from '../../dto/enum/user-search-type';
import { UserValidationService } from '../../services/user-validation.service';
import { UserDocument } from '../../../domain/user.entity';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { ConfirmPassDto } from '../../dto/confirm-pass.dto';
import { CryptoService } from '../../services/crypto.service';
import { CoreConfig } from '../../../../../core/core.config';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

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
    foundUser.clearPassConfirmation();

    // Password update, recovery-code consumption and logout from all devices
    // happen in one DB transaction. The user must authenticate again afterwards.
    const updated = await this.usersRepository.updatePasswordAndRevokeSessions(
      foundUser,
      dto.recoveryCode,
    );

    if (!updated) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Password recovery code is invalid, expired or already used.',
        errorsMessages: [
          { field: 'recoveryCode', message: 'Recovery code is no longer valid.' },
        ],
      });
    }
  }
}

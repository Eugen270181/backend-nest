import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UserSearchType } from '../../dto/enum/user-search-type';
import { UserValidationService } from '../../services/user-validation.service';
import { UserDocument } from '../../../domain/user.entity';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { EmailInputDto } from '../../../api/input-dto/email.input-dto';
import { UserConfirmCodeDto } from '../../../../../core/dto/type/user-confirm-code.dto';
import { UserHelperService } from '../../../../../core/adapters/user-helper.service';
import { SendUserEmailCodeEvent } from '../../../domain/events/send-user-email-code.event';
import { EmailType } from '../../../../../core/dto/enum/email-type.enum';
import { CoreConfig } from '../../../../../core/core.config';
import { UserAccountsConfig } from '../../../user-accounts.config';

export class RecoveryPasswordUserCommand {
  constructor(public readonly dto: EmailInputDto) {}
}

@CommandHandler(RecoveryPasswordUserCommand)
export class RecoveryPasswordUseCase
  implements ICommandHandler<RecoveryPasswordUserCommand, void>
{
  constructor(
    private coreConfig: CoreConfig,
    private userAccountsConfig: UserAccountsConfig,
    private readonly usersRepository: UsersRepository,
    private readonly userValidationService: UserValidationService,
    private readonly userHelperService: UserHelperService,
    private readonly eventBus: EventBus,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('RecoveryPasswordUseCase created');
  }

  async execute({ dto }: RecoveryPasswordUserCommand) {
    const userDocument: UserDocument | null =
      await this.userValidationService.findUser(
        UserSearchType.Email,
        dto.email,
      );

    if (!userDocument) return;

    const userConfirmCodeDto: UserConfirmCodeDto =
      this.userHelperService.createUserConfirmCodeDto(
        this.userAccountsConfig.passTime,
      );

    userDocument.setPassConfirmationCode(userConfirmCodeDto);

    await this.usersRepository.save(userDocument);

    this.eventBus.publish(
      new SendUserEmailCodeEvent(
        dto.email,
        userDocument.passConfirmation!.confirmationCode,
        EmailType.password_recovery,
      ),
    );
  }
}

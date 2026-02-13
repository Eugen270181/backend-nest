import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../../core/settings/config';
import { UserSearchType } from '../../dto/enum/user-search-type';
import { UserValidationService } from '../../services/user-validation.service';
import { UserDocument } from '../../../domain/user.entity';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { EmailInputDto } from '../../../api/input-dto/email.input-dto';
import { UserConfirmCodeDto } from '../../../../../core/dto/type/user-confirm-code.dto';
import { UserHelperService } from '../../../../../core/adapters/user-helper.service';
import { SendUserEmailCodeEvent } from '../../../domain/events/send-user-email-code.event';
import { EmailType } from '../../../../../core/dto/enum/email-type.enum';

export class ResendRegistrationCodeUserCommand {
  constructor(public readonly dto: EmailInputDto) {}
}

@CommandHandler(ResendRegistrationCodeUserCommand)
export class ResendRegistrationCodeUseCase
  implements ICommandHandler<ResendRegistrationCodeUserCommand>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userValidationService: UserValidationService,
    private readonly userHelperService: UserHelperService,
    private readonly eventBus: EventBus,
  ) {
    if (appConfig.IOC_LOG) console.log('ResendRegistrationCodeUseCase created');
  }

  async execute({ dto }: ResendRegistrationCodeUserCommand) {
    const userDocument: UserDocument =
      await this.userValidationService.ensureUserExistsNotConfirmed(
        UserSearchType.Email,
        dto.email,
      );

    const userConfirmCodeDto: UserConfirmCodeDto =
      this.userHelperService.createUserConfirmCodeDto(appConfig.EMAIL_TIME);

    userDocument.setRegConfirmationCode(userConfirmCodeDto);

    await this.usersRepository.save(userDocument);

    this.eventBus.publish(
      new SendUserEmailCodeEvent(
        dto.email,
        userDocument.emailConfirmation!.confirmationCode,
        EmailType.resend,
      ),
    );
  }
}

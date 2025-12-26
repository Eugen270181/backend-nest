import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../../core/settings/config';
import { UserSearchType } from '../../dto/enum/user-search-type';
import { UserValidationService } from '../../services/user-validation.service';
import { CodeService } from '../../../../../core/adapters/code.service';
import { DateService } from '../../../../../core/adapters/date.service';
import { UserDocument } from '../../../domain/user.entity';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { EmailService } from '../../../../notifications/email.service';
import { EmailInputDto } from '../../../api/input-dto/email.input-dto';
import { UserConfirmCodeDto } from '../../../../../core/dto/type/user-confirm-code.dto';
import { UserHelperService } from '../../../../../core/adapters/user-helper.service';
import { UserRegisteredEvent } from '../../../domain/events/user-registered.event';

export class RecoveryPasswordUserCommand {
  constructor(public readonly dto: EmailInputDto) {}
}

@CommandHandler(RecoveryPasswordUserCommand)
export class RecoveryPasswordUseCase
  implements ICommandHandler<RecoveryPasswordUserCommand, void>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userValidationService: UserValidationService,
    private readonly userHelperService: UserHelperService,
    private readonly eventBus: EventBus,
  ) {
    if (appConfig.IOC_LOG) console.log('RecoveryPasswordUseCase created');
  }

  async execute({ dto }: RecoveryPasswordUserCommand) {
    const userDocument: UserDocument | null =
      await this.userValidationService.findUser(
        UserSearchType.Email,
        dto.email,
      );
    if (!userDocument) return;

    const userConfirmCodeDto: UserConfirmCodeDto =
      this.userHelperService.createUserConfirmCodeDto(appConfig.PASS_TIME);

    userDocument.setPassConfirmationCode(userConfirmCodeDto);

    await this.usersRepository.save(userDocument);

    this.eventBus.publish(
      new UserRegisteredEvent(
        dto.email,
        userDocument.emailConfirmation!.confirmationCode,
      ),
    );
  }
}

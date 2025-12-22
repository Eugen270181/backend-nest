import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../../core/settings/config';
import { UserSearchType } from '../../dto/enum/user-search-type';
import { UserValidationService } from '../../user-validation.service';
import { CodeService } from '../../../../../core/adapters/code.service';
import { DateService } from '../../../../../core/adapters/date.service';
import { UserDocument } from '../../../domain/user.entity';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { EmailService } from '../../../../notifications/email.service';
import { EmailInputDto } from '../../../api/input-dto/email.input-dto';
import { UserConfirmCodeDto } from '../../../../../core/dto/type/user-confirm-code.dto';
import { UserHelperService } from '../../../../../core/adapters/user-helper.service';

export class ResendRegistrationCodeUserCommand {
  constructor(public readonly dto: EmailInputDto) {}
}

@CommandHandler(ResendRegistrationCodeUserCommand)
export class ResendRegistrationCodeUseCase
  implements ICommandHandler<ResendRegistrationCodeUserCommand, void>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userValidationService: UserValidationService,
    private readonly userHelperService: UserHelperService,
    private readonly emailService: EmailService,
  ) {
    if (appConfig.IOC_LOG) console.log('ResendRegistrationCodeUseCase created');
  }

  async execute({ dto }: ResendRegistrationCodeUserCommand) {
    const foundUser: UserDocument =
      await this.userValidationService.ensureUserExistsNotConfirmed(
        UserSearchType.Email,
        dto.email,
      );

    const userConfirmCodeDto: UserConfirmCodeDto =
      this.userHelperService.createUserConfirmCodeDto(appConfig.EMAIL_TIME);

    foundUser.setRegConfirmationCode(userConfirmCodeDto);

    await this.usersRepository.save(foundUser);

    //todo with publish sendmail notification
    // await this.emailService
    //   .sendConfirmationEmail(
    //     foundUser.email,
    //     userConfirmCodeDto.confirmationCode,
    //   )
    //   .catch(console.error);
  }
}

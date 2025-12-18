import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../core/settings/config';
import { UserSearchType } from '../dto/enum/user-search-type';
import { UserValidationService } from '../user-validation.service';
import { CodeService } from '../../../../core/adapters/code.service';
import { DateService } from '../../../../core/adapters/date.service';
import { UserDocument } from '../../domain/user.entity';
import { UsersRepository } from '../../infrastructure/users.repository';
import { EmailService } from '../../../notifications/email.service';
import { EmailInputDto } from '../../api/input-dto/email.input-dto';

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
    private readonly codeService: CodeService,
    private readonly dateService: DateService,
    private readonly emailService: EmailService,
  ) {
    if (appConfig.IOC_LOG) console.log('RecoveryPasswordUseCase created');
  }

  async execute({ dto }: RecoveryPasswordUserCommand) {
    const foundUser: UserDocument | null =
      await this.userValidationService.findUser(
        UserSearchType.Email,
        dto.email,
      );
    if (!foundUser) return;

    const code = this.codeService.genRandomCode();
    const expirationDate = this.dateService.addDuration(
      new Date(),
      appConfig.PASS_TIME,
    );

    foundUser.setPassConfirmationCode(code, expirationDate);

    await this.usersRepository.save(foundUser);

    this.emailService
      .sendConfirmationEmail(foundUser.email, code)
      .catch(console.error);
  }
}

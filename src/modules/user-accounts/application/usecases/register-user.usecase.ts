import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthViewDto } from '../../api/view-dto/auth.view-dto';
import { JwtService } from '@nestjs/jwt';
import { appConfig } from '../../../../core/settings/config';
import { UserSearchType } from '../dto/enum/user-search-type';
import { CreateUserDto } from '../dto/user.dto';
import { UserValidationService } from '../user-validation.service';
import { CryptoService } from '../crypto.service';
import { CodeService } from '../../../../core/adapters/code.service';
import { DateService } from '../../../../core/adapters/date.service';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../domain/user.entity';
import { UsersRepository } from '../../infrastructure/users.repository';
import { EmailService } from '../../../notifications/email.service';

export class RegisterUserCommand {
  constructor(public readonly dto: CreateUserDto) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase
  implements ICommandHandler<RegisterUserCommand, void>
{
  constructor(
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
    private readonly usersRepository: UsersRepository,
    private readonly userValidationService: UserValidationService,
    private readonly cryptoService: CryptoService,
    private readonly codeService: CodeService,
    private readonly dateService: DateService,
    private readonly emailService: EmailService,
  ) {
    if (appConfig.IOC_LOG) console.log('RegisterUserUseCase created');
  }

  async execute({ dto }: RegisterUserCommand) {
    await this.userValidationService.ensureUserUnique(
      UserSearchType.Login,
      dto.login,
    );
    await this.userValidationService.ensureUserUnique(
      UserSearchType.Email,
      dto.email,
    );

    const passwordHash = await this.cryptoService.getHash(dto.password);

    const code = this.codeService.genRandomCode();
    const expirationDate = this.dateService.addDuration(
      new Date(),
      appConfig.EMAIL_TIME,
    );

    // Используем статический метод модели напрямую
    const userDocument = this.UserModel.createUserByReg({
      login: dto.login,
      email: dto.email,
      passwordHash,
      code,
      date: expirationDate,
    });

    await this.usersRepository.save(userDocument);

    this.emailService
      .sendConfirmationEmail(userDocument.email, code)
      .catch(console.error);
  }
}

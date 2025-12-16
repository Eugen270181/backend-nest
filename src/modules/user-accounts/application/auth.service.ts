import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { CryptoService } from './crypto.service';
import { appConfig } from '../../../core/settings/config';
import { CreateUserDto } from './dto/user.dto';
import { EmailService } from '../../notifications/email.service';
import { AuthViewDto } from '../api/view-dto/auth.view-dto';
import { UserSearchType } from './dto/enum/user-search-type';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { CodeService } from '../../../core/adapters/code.service';
import { DateService } from '../../../core/adapters/date.service';
import { EmailDto } from './dto/email.dto';
import { ConfirmRegDto } from './dto/confirm-reg.dto';
import { ConfirmPassDto } from './dto/confirm-pass.dto';
import { UserValidationService } from './user-validation.service';
import { UsersRepository } from '../infrastructure/users.repository';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
    private userValidationService: UserValidationService,
    private jwtService: JwtService,
    private cryptoService: CryptoService,
    private emailService: EmailService,
    private codeService: CodeService,
    private dateService: DateService,
    private usersRepository: UsersRepository,
  ) {
    if (appConfig.IOC_LOG) console.log('AuthService created');
  }

  async validateUserById(userId: string): Promise<UserContextDto | null> {
    const userDocument: UserDocument | null =
      await this.userValidationService.findUser(UserSearchType.Id, userId);
    if (!userDocument) {
      return null;
    }

    return { id: userDocument._id.toString() };
  }

  async validateUserByCred(
    loginOrEmail: string,
    password: string,
  ): Promise<UserContextDto | null> {
    const userDocument: UserDocument | null =
      await this.userValidationService.findUser(
        UserSearchType.LoginOrEmail,
        loginOrEmail,
      );
    if (!userDocument) {
      return null;
    }

    const isPasswordValid = await this.cryptoService.checkHash(
      password,
      userDocument.passwordHash,
    );
    if (!isPasswordValid) {
      return null;
    }

    return { id: userDocument._id.toString() };
  }

  async login(id: string): Promise<AuthViewDto> {
    const accessToken = await this.jwtService.signAsync({ id });

    return { accessToken };
  }

  async registerUser(dto: CreateUserDto) {
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

  async regEmailResending(dto: EmailDto) {
    const foundUser: UserDocument =
      await this.userValidationService.ensureUserExistsNotConfirmed(
        UserSearchType.Email,
        dto.email,
      );

    const code = this.codeService.genRandomCode();
    const expirationDate = this.dateService.addDuration(
      new Date(),
      appConfig.EMAIL_TIME,
    );

    foundUser.setRegConfirmationCode(code, expirationDate);

    await this.usersRepository.save(foundUser);

    await this.emailService
      .sendConfirmationEmail(foundUser.email, code)
      .catch(console.error);
  }

  async regConfirm(dto: ConfirmRegDto) {
    const foundUser: UserDocument =
      await this.userValidationService.ensureUserExistsNotExpiredNotConfirmed(
        UserSearchType.RegConfirmCode,
        dto.code,
      );

    foundUser.activateConfirmation();

    await this.usersRepository.save(foundUser);
  }

  async passRecovery(dto: EmailDto) {
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

  async passConfirm(dto: ConfirmPassDto) {
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

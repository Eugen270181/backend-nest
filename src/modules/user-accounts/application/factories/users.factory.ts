import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';
import { Injectable } from '@nestjs/common';
import { CryptoService } from '../services/crypto.service';
import { UserValidationService } from '../services/user-validation.service';
import { appConfig } from '../../../../core/settings/config';
import { CreateUserDto } from '../dto/create-user.dto';
import { CreateUserDomainDto } from '../../domain/dto/create-user.domain.dto';
import { UserHelperService } from '../../../../core/adapters/user-helper.service';
import { UserConfirmCodeDto } from '../../../../core/dto/type/user-confirm-code.dto';
import { UsersRepository } from '../../infrastructure/users.repository';

@Injectable()
export class UsersFactory {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private readonly userValidationService: UserValidationService,
    private readonly cryptoService: CryptoService,
    private readonly userHelperService: UserHelperService,
  ) {
    if (appConfig.IOC_LOG) console.log('UsersFactory created');
  }

  private async createUserEntity(dto: CreateUserDto): Promise<UserDocument> {
    //проверка уникальности создаваемого пользователя
    await this.userValidationService.ensureCreateUserUnique(dto);
    //генерация хеша пароля
    const passwordHash = await this.cryptoService.getHash(dto.password);
    //создание дто для создания базового юзера
    const createUserDomainDto: CreateUserDomainDto = {
      login: dto.login,
      email: dto.email,
      passwordHash,
    };

    return this.UserModel.createInstance(createUserDomainDto);
  }

  // PUBLIC сценарий 1: Админ создаёт пользователя (подтвержден)
  async createUserBySa(dto: CreateUserDto): Promise<UserDocument> {
    //создаем базового юзера - сущность экземпляр расширеного класса User
    const userDocument: UserDocument = await this.createUserEntity(dto);
    //устанавливаем признак подтвержденного пользователя - активация
    userDocument.setUserConfirmation();
    //возвращаем расширеную сущность - документ юзера
    return userDocument;
  }

  // PUBLIC сценарий 2: Пользователь регистрируется (не подтвержден)
  async createUserByReg(dto: CreateUserDto): Promise<UserDocument> {
    //создаем базового юзера - сущность экземпляр расширеного класса User
    const userDocument: UserDocument = await this.createUserEntity(dto);
    //создаем дто для регистрации юзера с кодом и датой протухания кода
    const userConfirmCodeDto: UserConfirmCodeDto =
      this.userHelperService.createUserConfirmCodeDto(appConfig.EMAIL_TIME);
    //устанавливаем ее в сущность юзера через метод
    userDocument.setRegConfirmationCode(userConfirmCodeDto);
    //возвращаем расширеную сущность - документ юзера
    return userDocument;
  }
}

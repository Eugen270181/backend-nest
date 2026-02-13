import { UsersRepository } from '../../infrastructure/users.repository';
import { UserSearchType } from '../dto/enum/user-search-type';
import { UserDocument } from '../../domain/user.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Injectable } from '@nestjs/common';
import { appConfig } from '../../../../core/settings/config';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UserValidationService {
  constructor(private readonly usersRepository: UsersRepository) {
    if (appConfig.IOC_LOG) console.log('UserValidationService created');
  }
  //1. Блок поиска юзера по ключу поиска
  async findUser(
    searchType: UserSearchType,
    value: string,
  ): Promise<UserDocument | null> {
    switch (searchType) {
      case UserSearchType.Id:
        return this.usersRepository.findById(value);
      case UserSearchType.Login:
        return this.usersRepository.findByLogin(value);
      case UserSearchType.Email:
        return this.usersRepository.findByEmail(value);
      case UserSearchType.LoginOrEmail:
        return this.usersRepository.findByLoginOrEmail(value);
      case UserSearchType.RegConfirmCode:
        return this.usersRepository.findUserByRegConfirmCode(value);
      case UserSearchType.PassConfirmCode:
        return this.usersRepository.findUserByPassConfirmCode(value);
    }
  }

  async findUserOrFail(
    searchType: UserSearchType,
    value: string,
  ): Promise<UserDocument> {
    const userDocument = await this.findUser(searchType, value);
    if (!userDocument) {
      const message = `User with ${searchType}:${value} - not found`;
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message,
        errorsMessages: [{ message, field: `${searchType}` }],
      });
    }
    return userDocument;
  }

  async checkUserUniqueByKey(searchType: UserSearchType, value: string) {
    const userDocument = await this.findUser(searchType, value);
    if (userDocument) {
      const message = `User with ${searchType}:${value} - already exists`;
      throw new DomainException({
        code: DomainExceptionCode.NotUnique,
        message,
        errorsMessages: [{ message, field: `${searchType}` }],
      });
    }
  }

  //2. Блок различной валидации существующего пользователя
  async ensureUserExists(
    searchType: UserSearchType,
    value: string,
  ): Promise<UserDocument> {
    const userDocument = await this.findUser(searchType, value);
    if (!userDocument) {
      const message = `User with ${searchType}:${value} - not found`;
      throw new DomainException({
        code:
          searchType === UserSearchType.Id
            ? DomainExceptionCode.NotFound
            : DomainExceptionCode.BadRequest,
        message,
        errorsMessages: [{ message, field: `${searchType}` }],
      });
    }
    return userDocument;
  }

  async ensureUserExistsNotConfirmed(
    searchType: UserSearchType,
    value: string,
  ): Promise<UserDocument> {
    const userDocument = await this.ensureUserExists(searchType, value);

    if (userDocument.isConfirmed) {
      const message = `User with ${searchType}:${value} - is confirmed yet`;
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message,
        errorsMessages: [{ message, field: `${searchType}` }],
      });
    }

    return userDocument;
  }

  async ensureUserExistsNotExpired(
    searchType: UserSearchType,
    value: string,
  ): Promise<UserDocument> {
    const userDocument = await this.ensureUserExists(searchType, value);

    const confifmObj =
      searchType === UserSearchType.RegConfirmCode
        ? userDocument.emailConfirmation
        : userDocument.passConfirmation;
    if (confifmObj!.expirationDate < new Date()) {
      const message = `User with ${searchType}:${value} - code is expired`;
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message,
        errorsMessages: [{ message, field: `${searchType}` }],
      });
    }

    return userDocument;
  }

  async ensureUserExistsNotExpiredNotConfirmed(
    searchType: UserSearchType,
    value: string,
  ) {
    const userDocument = await this.ensureUserExistsNotExpired(
      searchType,
      value,
    );

    if (userDocument.isConfirmed) {
      const message = `User with ${searchType}:${value} - is confirmed yet`;
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message,
        errorsMessages: [{ message, field: `${searchType}` }],
      });
    }

    return userDocument;
  }
  //2. Валидация уникальности создаваемого пользователя
  async ensureCreateUserUnique(
    dto: Omit<CreateUserDto, 'password'>,
  ): Promise<void> {
    await this.checkUserUniqueByKey(UserSearchType.Login, dto.login);
    await this.checkUserUniqueByKey(UserSearchType.Email, dto.email);
  }
}

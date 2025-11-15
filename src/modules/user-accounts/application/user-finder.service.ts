import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { UserSearchType } from './dto/enum/user-search-type';
import { UsersRepository } from '../infrastructure/users.repository';
import { UserDocument } from '../domain/user.entity';

export abstract class UserFinderService {
  protected constructor(protected readonly usersRepository: UsersRepository) {}

  protected async findUser(
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

  protected async ensureUserExists(
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

  protected async ensureUserExistsNotConfirmed(
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

  protected async ensureUserExistsNotExpired(
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

  protected async ensureUserExistsNotExpiredNotConfirmed(
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

  protected async ensureUserUnique(
    searchType: UserSearchType,
    value: string,
  ): Promise<void> {
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
}

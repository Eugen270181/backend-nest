import { Injectable } from '@nestjs/common';
import { appConfig } from '../../../../core/settings/config';
import { UserValidationService } from './user-validation.service';
import { UserContextDto } from '../../guards/dto/user-context.dto';
import { UserDocument } from '../../domain/user.entity';
import { UserSearchType } from '../dto/enum/user-search-type';
import { CryptoService } from './crypto.service';

@Injectable()
export class AuthValidationService {
  constructor(
    private userValidationService: UserValidationService,
    private cryptoService: CryptoService,
  ) {
    if (appConfig.IOC_LOG) console.log('AuthValidationService created');
  }

  /**
   * Используется в JWT Strategy validate() методе
   * Проверяет существование пользователя по ID из JWT payload
   */
  async validateUserById(userId: string): Promise<UserContextDto | null> {
    const userDocument: UserDocument | null =
      await this.userValidationService.findUser(UserSearchType.Id, userId);
    if (!userDocument) {
      return null;
    }

    return { id: userDocument._id.toString() };
  }
  /**
   * Используется в Local Strategy validate() методе
   * Проверяет существование пользователя по CRED: loginOrEmail/password
   */
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
}

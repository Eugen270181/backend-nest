import { Injectable } from '@nestjs/common';
import { appConfig } from '../../../../core/settings/config';
import { UserValidationService } from './user-validation.service';
import { UserContextDto } from '../../guards/dto/user-context.dto';
import { UserSearchType } from '../dto/enum/user-search-type';
import { CryptoService } from './crypto.service';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { RefreshTokenPayloadDto } from '../../guards/dto/refresh-token-payload.dto';
import { SessionDocument } from '../../domain/session.entity';
import { UserDocument } from '../../domain/user.entity';

@Injectable()
export class AuthValidationService {
  constructor(
    private userValidationService: UserValidationService,
    private cryptoService: CryptoService,
    private sessionsRepository: SessionsRepository,
  ) {
    if (appConfig.IOC_LOG) console.log('AuthValidationService created');
  }

  /**
   * Используется в JWT Strategy validate() методе
   * Проверяет существование пользователя по ID из JWT payload
   */
  async validateUserById(userId: string): Promise<string | null> {
    const userDocument: UserDocument | null =
      await this.userValidationService.findUser(UserSearchType.Id, userId);
    if (!userDocument) {
      return null;
    }

    return userDocument._id.toString();
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

    return { userId: userDocument._id.toString() };
  }

  /** ✅ НОВЫЙ: валидация RT + сессия */
  async validateRefreshToken(
    jwtPayload: RefreshTokenPayloadDto,
  ): Promise<UserContextDto | null> {
    // 1. Проверяем user существует (вдруг удалили)
    const validUserId = await this.validateUserById(jwtPayload.userId);
    if (!validUserId) return null;

    // 2. Проверяем активную сессию {deviceId, lastActiveDate}
    const activeSession: SessionDocument | null =
      await this.sessionsRepository.findSessionByActiveToken(
        jwtPayload.deviceId,
        new Date(jwtPayload.iat * 1000),
      );

    if (!activeSession || activeSession.expDate < new Date()) {
      return null; // Сессия не найдена или протухла(мало ли)
    }

    return { userId: validUserId, deviceId: jwtPayload.deviceId };
  }
}

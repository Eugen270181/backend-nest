import { Injectable } from '@nestjs/common';
import { UserValidationService } from './user-validation.service';
import { UserContextDto } from '../../guards/dto/user-context.dto';
import { UserSearchType } from '../dto/enum/user-search-type';
import { CryptoService } from './crypto.service';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { RefreshTokenPayloadDto } from '../../guards/dto/refresh-token-payload.dto';
import { UserDocument } from '../../domain/user.entity';
import { CoreConfig } from '../../../../core/core.config';

@Injectable()
export class AuthValidationService {
  constructor(
    private coreConfig: CoreConfig,
    private userValidationService: UserValidationService,
    private cryptoService: CryptoService,
    private sessionsRepository: SessionsRepository,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('AuthValidationService created');
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

    return userDocument.id!;
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

    return { userId: userDocument.id! };
  }

  /** ✅ НОВЫЙ: валидация RT + сессия */
  async validateRefreshToken(
    jwtPayload: RefreshTokenPayloadDto,
  ): Promise<UserContextDto | null> {
    const validUserId = await this.validateUserById(jwtPayload.userId);
    if (!validUserId) return null;

    const session = await this.sessionsRepository.findSessionById(
      jwtPayload.deviceId,
    );
    if (!session) return null;

    if (session.tokenVersion !== jwtPayload.ver) return null; // старый/уже использованный RT
    if (session.expDate < new Date()) return null; // сессия протухла

    return { userId: validUserId, deviceId: jwtPayload.deviceId };
  }
}

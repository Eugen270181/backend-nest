import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UsersRepository } from '../infrastructure/users.repository';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { CreateUserDto } from './dto/user.dto';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { appConfig } from '../../../core/settings/config';
import { UserSearchType } from './dto/enum/user-search-type';
import { CryptoService } from './crypto.service';
import { UserFinderService } from './user-finder.service';

@Injectable()
export class UsersService extends UserFinderService {
  constructor(
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
    usersRepository: UsersRepository,
    private readonly cryptoService: CryptoService,
  ) {
    super(usersRepository);
    if (appConfig.IOC_LOG) console.log('UsersService created');
  }

  async createUser(dto: CreateUserDto): Promise<string> {
    // Проверяем уникальность логина и email
    await this.ensureUserUnique(UserSearchType.Login, dto.login);
    await this.ensureUserUnique(UserSearchType.Email, dto.email);

    const passwordHash = await this.cryptoService.getHash(dto.password);
    const userDocument = this.UserModel.createUserBySa({
      email: dto.email,
      login: dto.login,
      passwordHash: passwordHash,
    });

    await this.usersRepository.save(userDocument);

    return userDocument._id.toString();
  }

  async deleteUserById(id: string) {
    await this.ensureUserExists(UserSearchType.Id, id);

    await this.usersRepository.deleteUserById(id);
  }
}

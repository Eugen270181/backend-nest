import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UsersRepository } from '../infrastructure/users.repository';
import { User, UserModelType } from '../domain/user.entity';
import { appConfig } from '../../../core/settings/config';
import { UserSearchType } from './dto/enum/user-search-type';
import { CryptoService } from './crypto.service';
import { UserValidationService } from './user-validation.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
    private readonly usersRepository: UsersRepository,
    private readonly cryptoService: CryptoService,
    private readonly userValidationService: UserValidationService,
  ) {
    if (appConfig.IOC_LOG) console.log('UsersService created');
  }

  async deleteUserById(id: string) {
    await this.userValidationService.ensureUserExists(UserSearchType.Id, id);

    await this.usersRepository.deleteUserById(id);
  }
}

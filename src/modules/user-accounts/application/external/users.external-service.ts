import { User, UserModelType } from '../../domain/user.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UsersRepository } from '../../infrastructure/users.repository';
import { appConfig } from '../../../../core/settings/config';

@Injectable()
export class UsersExternalService {
  constructor(
    //инжектирование модели в сервис через DI
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
    private readonly usersRepository: UsersRepository,
  ) {
    if (appConfig.IOC_LOG) console.log('UsersExternalService created');
  }
  //todo for future functionality in usecase others modules
  async makeUserAsSpammer(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('userDocument not found');
    }

    // user.makeSpammer();

    await this.usersRepository.save(user);
  }
}

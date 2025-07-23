import { User, UserModelType } from '../domain/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UsersRepository } from '../infrastructure/users.repository';

@Injectable()
export class UsersExternalService {
  constructor(
    //инжектирование модели в сервис через DI
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
    private readonly usersRepository: UsersRepository,
  ) {
    console.log('UsersExternalService created');
  }
  //todo for future functionality in usecase others modules
  async makeUserAsSpammer(userId: string) {
    const user = await this.usersRepository.findOrNotFoundFail(userId);

    // user.makeSpammer();

    await this.usersRepository.save(user);
  }
}

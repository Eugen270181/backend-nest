import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { Injectable } from '@nestjs/common';
import { appConfig } from '../../../core/settings/config';

@Injectable()
export class UsersRepository {
  //инжектирование модели через DI
  constructor(
    @InjectModel(User.name) private readonly UserModel: UserModelType,
  ) {
    if (appConfig.IOC_LOG) console.log('UsersRepository created');
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ _id: id }).catch(() => null);
  }

  async findByLogin(login: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ login }).catch(() => null);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ email }).catch(() => null);
  }

  async save(userDocument: UserDocument) {
    await userDocument.save();
  }

  async deleteUserById(id: string) {
    await this.UserModel.deleteOne({ _id: id });
  }
}

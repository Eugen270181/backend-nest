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

  async save(userDocument: UserDocument) {
    await userDocument.save();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ _id: id }).catch(() => null);
  }

  async findByLogin(login: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ login });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ email });
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<UserDocument | null> {
    const search = { $or: [{ login: loginOrEmail }, { email: loginOrEmail }] };
    return this.UserModel.findOne(search);
  }

  async findUserByRegConfirmCode(code: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      'emailConfirmation.confirmationCode': code,
    });
  }
  async findUserByPassConfirmCode(code: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      'passConfirmation.confirmationCode': code,
    });
  }

  async deleteUserById(id: string) {
    await this.UserModel.deleteOne({ _id: id });
  }
}

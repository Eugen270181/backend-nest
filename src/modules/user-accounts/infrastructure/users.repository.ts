import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { Injectable } from '@nestjs/common';
import { CoreConfig } from '../../../core/core.config';
import { Error as MongooseError } from 'mongoose';

@Injectable()
export class UsersRepository {
  //инжектирование модели через DI
  constructor(
    private coreConfig: CoreConfig,
    @InjectModel(User.name) private readonly UserModel: UserModelType,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('UsersRepository created');
  }

  async save(userDocument: UserDocument) {
    await userDocument.save();
  }

  async findById(id: string): Promise<UserDocument | null> {
    try {
      return this.UserModel.findOne({
        _id: id,
        deletedAt: null,
      });
    } catch (e) {
      if (e instanceof MongooseError.CastError) return null; // невалидный id → «не найдено»
      throw e; // обрыв коннекта и пр. → 500
    }
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

  async deleteUserById(_id: string) {
    await this.UserModel.deleteOne({ _id });
  }
}

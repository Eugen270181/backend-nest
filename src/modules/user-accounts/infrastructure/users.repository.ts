import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class UsersRepository {
  //инжектирование модели через DI
  constructor(
    @InjectModel(User.name) private readonly UserModel: UserModelType,
  ) {
    console.log('UsersRepository created');
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    }).catch(() => null);
  }

  async save(userDocument: UserDocument) {
    await userDocument.save();
  }

  async findOrNotFoundFail(id: string): Promise<UserDocument> {
    const userDocument = await this.findById(id);

    if (!userDocument) {
      //TODO: replace with domain exception
      throw new NotFoundException('userDocument not found');
    }

    return userDocument;
  }

  async deleteUserById(id: string) {
    await this.UserModel.deleteOne({
      _id: id,
    });
  }
}

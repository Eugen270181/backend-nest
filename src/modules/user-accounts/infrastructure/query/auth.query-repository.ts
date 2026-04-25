import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';
import { MeViewDto } from '../../api/view-dto/me.view-dto';
import { CoreConfig } from '../../../../core/core.config';
import { Error as MongooseError } from 'mongoose';

@Injectable()
export class AuthQueryRepository {
  constructor(
    private coreConfig: CoreConfig,
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('AuthQueryRepository created');
  }

  async findById(id: string): Promise<UserDocument | null> {
    try {
      return this.UserModel.findOne({ _id: id });
    } catch (e) {
      if (e instanceof MongooseError.CastError) return null; // невалидный id → «не найдено»
      throw e; // обрыв коннекта и пр. → 500
    }
  }

  async getMeById(id: string): Promise<MeViewDto | null> {
    const userDocument = await this.findById(id);
    if (!userDocument) return null;

    return MeViewDto.mapToView(userDocument);
  }
}

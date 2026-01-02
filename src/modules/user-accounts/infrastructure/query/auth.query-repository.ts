import { Injectable } from '@nestjs/common';
import { MeViewDto } from '../../api/view-dto/user.view-dto';
import { InjectModel } from '@nestjs/mongoose';
import { appConfig } from '../../../../core/settings/config';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';

@Injectable()
export class AuthQueryRepository {
  constructor(
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
  ) {
    if (appConfig.IOC_LOG) console.log('AuthQueryRepository created');
  }

  async findById(_id: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ _id }).catch(() => null);
  }

  async getMeById(id: string): Promise<MeViewDto | null> {
    const userDocument = await this.findById(id);
    if (!userDocument) return null;

    return MeViewDto.mapToView(userDocument);
  }
}

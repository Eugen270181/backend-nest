import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';
import { UserExternalViewDto } from './external-dto/user.external-view-dto';
import { CoreConfig } from '../../../../core/core.config';

@Injectable()
export class UsersExternalQueryRepository {
  constructor(
    private coreConfig: CoreConfig,
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
  ) {
    if (this.coreConfig.IOC_LOG)
      console.log('UsersExternalQueryRepository created');
  }

  async findById(id: string): Promise<UserDocument | null> {
    return await this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    }).catch(() => null);
  }

  async getById(id: string): Promise<UserExternalViewDto | null> {
    const userDocument = await this.findById(id);

    if (!userDocument) return null;

    return UserExternalViewDto.mapToView(userDocument);
  }
}

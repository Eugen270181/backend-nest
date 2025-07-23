import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../domain/user.entity';
import { UserExternalViewDto } from './external-dto/user.external-view-dto';

@Injectable()
export class UsersExternalQueryRepository {
  constructor(
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
  ) {
    console.log('UsersExternalQueryRepository created');
  }

  async getByIdOrNotFoundFail(id: string): Promise<UserExternalViewDto> {
    const user = await this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    return UserExternalViewDto.mapToView(user);
  }
}

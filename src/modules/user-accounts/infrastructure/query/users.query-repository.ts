import { InjectModel } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { FilterQuery } from 'mongoose';

export class UsersQueryRepository {
  constructor(
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
  ) {
    console.log('UsersQueryRepository created');
  }

  async getByIdOrNotFoundFail(id: string): Promise<UserViewDto> {
    const userDocument = await this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!userDocument) {
      throw new NotFoundException('userDocument not found');
    }

    return UserViewDto.mapToView(userDocument);
  }

  async getAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const filter: FilterQuery<User> = {
      deletedAt: null,
    };

    if (query.searchLoginTerm) {
      filter.$or = filter.$or || [];
      filter.$or.push({
        login: { $regex: query.searchLoginTerm, $options: 'i' },
      });
    }

    if (query.searchEmailTerm) {
      filter.$or = filter.$or || [];
      filter.$or.push({
        email: { $regex: query.searchEmailTerm, $options: 'i' },
      });
    }

    //console.log('query', JSON.stringify(query));
    const users: UserDocument[] = await this.UserModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .lean();
    const totalCount = await this.UserModel.countDocuments(filter);

    const items: UserViewDto[] = users.map((el: UserDocument) =>
      UserViewDto.mapToView(el),
    );

    return PaginatedViewDto.mapToView<UserViewDto[]>({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}

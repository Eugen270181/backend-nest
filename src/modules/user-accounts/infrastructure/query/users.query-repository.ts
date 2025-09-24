import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { FilterQuery } from 'mongoose';
import { appConfig } from '../../../../core/settings/config';

export class UsersQueryRepository {
  constructor(
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
  ) {
    if (appConfig.IOC_LOG) console.log('UsersQueryRepository created');
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    }).catch(() => null);
  }

  async getById(id: string): Promise<UserViewDto | null> {
    const userDocument = await this.findById(id);

    if (!userDocument) return null;

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

    return this.getUsers(filter, query);
  }
  //todo with userId
  private async getUsers(
    filter: FilterQuery<User>,
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const users: UserDocument[] = await this.UserModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .lean();

    const totalCount = await this.UserModel.countDocuments(filter);

    const items = users.map((el: UserDocument) => UserViewDto.mapToView(el));

    return PaginatedViewDto.mapToView<UserViewDto[]>({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}

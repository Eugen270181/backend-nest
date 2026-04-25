import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { Error as MongooseError, FilterQuery } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { CoreConfig } from '../../../../core/core.config';
import { escapeRegex } from '../../../../core/constants/router-paths';

@Injectable()
export class UsersQueryRepository {
  constructor(
    private coreConfig: CoreConfig,
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('UsersQueryRepository created');
  }

  private async findById(id: string): Promise<UserDocument | null> {
    try {
      return this.UserModel.findOne({ _id: id });
    } catch (e) {
      if (e instanceof MongooseError.CastError) return null; // невалидный id → «не найдено»
      throw e; // обрыв коннекта и пр. → 500
    }
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
        login: { $regex: escapeRegex(query.searchLoginTerm), $options: 'i' },
      });
    }

    if (query.searchEmailTerm) {
      filter.$or = filter.$or || [];
      filter.$or.push({
        email: { $regex: escapeRegex(query.searchEmailTerm), $options: 'i' },
      });
    }

    return this.getUsers(filter, query);
  }

  private async getUsers(
    filter: FilterQuery<User>,
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const [users, totalCount] = await Promise.all([
      this.UserModel.find(filter)
        .sort({ [query.sortBy]: query.sortDirection })
        .skip(query.calculateSkip())
        .limit(query.pageSize)
        .lean(),
      this.UserModel.countDocuments(filter),
    ]);

    const items = users.map((el: UserDocument) => UserViewDto.mapToView(el));

    return PaginatedViewDto.mapToView<UserViewDto[]>({
      items,
      totalCount,
      page: query.pageNumber,
      pageSize: query.pageSize,
    });
  }
}

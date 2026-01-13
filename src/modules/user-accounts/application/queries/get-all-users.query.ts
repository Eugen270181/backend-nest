import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../infrastructure/query/users.query-repository';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { appConfig } from '../../../../core/settings/config';

export class GetAllUsersQuery {
  constructor(public readonly query: GetUsersQueryParams) {}
}

@QueryHandler(GetAllUsersQuery)
export class GetAllUsersQueryHandler
  implements IQueryHandler<GetAllUsersQuery, PaginatedViewDto<UserViewDto[]>>
{
  constructor(private usersQueryRepository: UsersQueryRepository) {
    if (appConfig.IOC_LOG) console.log('GetAllUsersQueryHandler created');
  }

  async execute({
    query,
  }: GetAllUsersQuery): Promise<PaginatedViewDto<UserViewDto[]>> {
    return this.usersQueryRepository.getAll(query);
  }
}

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../infrastructure/query/users.query-repository';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { CoreConfig } from '../../../../core/core.config';

export class GetAllUsersQuery {
  constructor(public readonly query: GetUsersQueryParams) {}
}

@QueryHandler(GetAllUsersQuery)
export class GetAllUsersQueryHandler
  implements IQueryHandler<GetAllUsersQuery, PaginatedViewDto<UserViewDto[]>>
{
  constructor(
    private coreConfig: CoreConfig,
    private usersQueryRepository: UsersQueryRepository,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('GetAllUsersQueryHandler created');
  }

  async execute({
    query,
  }: GetAllUsersQuery): Promise<PaginatedViewDto<UserViewDto[]>> {
    return this.usersQueryRepository.getAll(query);
  }
}

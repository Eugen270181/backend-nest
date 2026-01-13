import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../infrastructure/query/users.query-repository';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { appConfig } from '../../../../core/settings/config';

export class GetUserQuery {
  constructor(
    public readonly id: string,
    public readonly justCreated: boolean = false,
  ) {}
}

@QueryHandler(GetUserQuery)
export class GetUserQueryHandler
  implements IQueryHandler<GetUserQuery, UserViewDto>
{
  constructor(private usersQueryRepository: UsersQueryRepository) {
    if (appConfig.IOC_LOG) console.log('GetUserQueryHandler created');
  }

  async execute({ id, justCreated }: GetUserQuery): Promise<UserViewDto> {
    const userViewDto = await this.usersQueryRepository.getById(id);

    if (!userViewDto) {
      if (!justCreated) {
        throw new DomainException({
          code: DomainExceptionCode.NotFound,
          message: `User not found: ${id}`,
        });
      } else {
        throw new Error(`Just Created User with id:${id} - Not found`);
      }
    }

    return userViewDto;
  }
}

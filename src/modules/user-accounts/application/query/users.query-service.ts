import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { UsersQueryRepository } from '../../infrastructure/query/users.query-repository';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { appConfig } from '../../../../core/settings/config';

@Injectable()
export class UsersQueryService {
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {
    if (appConfig.IOC_LOG) console.log('UsersQueryService created');
  }

  async getUserViewDtoOrFail(
    id: string,
    justCreated: boolean = false,
  ): Promise<UserViewDto> {
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

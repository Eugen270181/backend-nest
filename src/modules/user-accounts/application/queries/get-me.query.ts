import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MeViewDto } from '../../api/view-dto/user.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { appConfig } from '../../../../core/settings/config';
import { AuthQueryRepository } from '../../infrastructure/query/auth.query-repository';

export class GetMeQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetMeQuery)
export class GetMeQueryHandler implements IQueryHandler<GetMeQuery, MeViewDto> {
  constructor(private authQueryRepository: AuthQueryRepository) {
    if (appConfig.IOC_LOG) console.log('GetMeQueryHandler created');
  }

  async execute({ id }: GetMeQuery): Promise<MeViewDto> {
    const meViewDto = await this.authQueryRepository.getMeById(id);

    if (!meViewDto) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: `User not found in DB: ${id}`,
      });
    }

    return meViewDto;
  }
}

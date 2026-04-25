import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { AuthQueryRepository } from '../../infrastructure/query/auth.query-repository';
import { MeViewDto } from '../../api/view-dto/me.view-dto';
import { CoreConfig } from '../../../../core/core.config';

export class GetMeQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetMeQuery)
export class GetMeQueryHandler implements IQueryHandler<GetMeQuery, MeViewDto> {
  constructor(
    private coreConfig: CoreConfig,
    private authQueryRepository: AuthQueryRepository,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('GetMeQueryHandler created');
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

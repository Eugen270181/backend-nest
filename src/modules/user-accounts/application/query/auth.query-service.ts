import { Injectable } from '@nestjs/common';
import { appConfig } from '../../../../core/settings/config';
import { MeViewDto } from '../../api/view-dto/user.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { AuthQueryRepository } from '../../infrastructure/query/auth.query-repository';

@Injectable()
export class AuthQueryService {
  constructor(private readonly authQueryRepository: AuthQueryRepository) {
    if (appConfig.IOC_LOG) console.log('AuthQueryService created');
  }

  async getMeViewDtoOrFail(id: string): Promise<MeViewDto> {
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

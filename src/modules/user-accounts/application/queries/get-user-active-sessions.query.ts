import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SessionViewDto } from '../../api/view-dto/session-view.dto';
import { SessionsQueryRepository } from '../../infrastructure/query/sessions.query-repository';
import { CoreConfig } from '../../../../core/core.config';

export class GetUserActiveSessionsQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetUserActiveSessionsQuery)
export class GetUserActiveSessionsQueryHandler
  implements IQueryHandler<GetUserActiveSessionsQuery, SessionViewDto[]>
{
  constructor(
    private coreConfig: CoreConfig,
    private sessionsQueryRepository: SessionsQueryRepository,
  ) {
    if (this.coreConfig.IOC_LOG)
      console.log('GetUserActiveSessionsQueryHandler created');
  }

  async execute({
    userId,
  }: GetUserActiveSessionsQuery): Promise<SessionViewDto[]> {
    return this.sessionsQueryRepository.getActiveSessions(userId);
  }
}

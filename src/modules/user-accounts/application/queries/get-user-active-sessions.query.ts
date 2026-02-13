import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../core/settings/config';
import { SessionViewDto } from '../../api/view-dto/session-view.dto';
import { SessionsQueryRepository } from '../../infrastructure/query/sessions.query-repository';

export class GetUserActiveSessionsQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetUserActiveSessionsQuery)
export class GetUserActiveSessionsQueryHandler
  implements IQueryHandler<GetUserActiveSessionsQuery, SessionViewDto[]>
{
  constructor(private sessionsQueryRepository: SessionsQueryRepository) {
    if (appConfig.IOC_LOG)
      console.log('GetUserActiveSessionsQueryHandler created');
  }

  async execute({
    userId,
  }: GetUserActiveSessionsQuery): Promise<SessionViewDto[]> {
    return this.sessionsQueryRepository.getActiveSessions(userId);
  }
}

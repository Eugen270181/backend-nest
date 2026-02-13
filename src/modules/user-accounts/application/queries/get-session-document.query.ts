import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { SessionDocument } from '../../domain/session.entity';

export class GetSessionDocumentQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetSessionDocumentQuery)
export class GetSessionDocumentQueryHandler
  implements IQueryHandler<GetSessionDocumentQuery, SessionDocument>
{
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async execute({ id }: GetSessionDocumentQuery): Promise<SessionDocument> {
    const sessionDocument = await this.sessionsRepository.findSessionById(id);

    if (!sessionDocument) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `Session not found: ${id}`,
      });
    }

    return sessionDocument;
  }
}

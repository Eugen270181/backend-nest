import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostDocument } from '../../domain/post.entity';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class GetPostDocumentQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetPostDocumentQuery)
export class GetPostDocumentQueryHandler
  implements IQueryHandler<GetPostDocumentQuery, PostDocument>
{
  constructor(private readonly postsRepository: PostsRepository) {}

  async execute({ id }: GetPostDocumentQuery): Promise<PostDocument> {
    const postDocument = await this.postsRepository.findById(id);

    if (!postDocument) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `Post not found: ${id}`,
      });
    }

    return postDocument;
  }
}

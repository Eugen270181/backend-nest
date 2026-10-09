import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { PostsQueryRepository } from '../../infrastructure/query/posts.query-repository';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { CoreConfig } from '../../../../../core/core.config';

export class GetPostQuery {
  constructor(
    public readonly postId: string,
    public readonly justCreated: boolean = false,
  ) {}
}

@QueryHandler(GetPostQuery)
export class GetPostQueryHandler
  implements IQueryHandler<GetPostQuery, PostViewDto>
{
  constructor(
    private coreConfig: CoreConfig,
    private postsQueryRepository: PostsQueryRepository,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('GetPostQueryHandler created');
  }

  async execute({ postId, justCreated }: GetPostQuery) {
    const postViewDto = await this.postsQueryRepository.getById(postId);

    if (!postViewDto) {
      if (!justCreated) {
        throw new DomainException({
          code: DomainExceptionCode.NotFound,
          message: `Post with id:${postId} - Not found`,
        });
      } else {
        throw new Error(`Just Created Post with id:${postId} - Not found`);
      }
    }

    return postViewDto;
  }
}

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../../core/settings/config';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { PostsQueryRepository } from '../../infrastructure/query/posts.query-repository';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { PostEnrichmentService } from '../services/post-enrichment.service';

export class GetPostQuery {
  constructor(
    public readonly postId: string,
    public readonly userId?: string,
    public readonly justCreated: boolean = false,
  ) {}
}

@QueryHandler(GetPostQuery)
export class GetPostQueryHandler
  implements IQueryHandler<GetPostQuery, PostViewDto>
{
  constructor(
    private postsQueryRepository: PostsQueryRepository,
    private postsEnrichmentService: PostEnrichmentService,
  ) {
    if (appConfig.IOC_LOG) console.log('GetPostQueryHandler created');
  }

  async execute({ postId, userId, justCreated }: GetPostQuery) {
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

    return this.postsEnrichmentService.enrich(postViewDto, userId);
  }
}

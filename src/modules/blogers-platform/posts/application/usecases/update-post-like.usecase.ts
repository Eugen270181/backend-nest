import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { GetPostDocumentQuery } from '../queries/get-post-document.query';
import { PostDocument } from '../../domain/post.entity';
import { LikePostDto } from '../../../likes/application/dto/like-post.dto';
import { LikesPostsRepository } from '../../../likes/infrastructure/likes-posts.repository';

export class UpdatePostLikeCommand {
  constructor(public readonly dto: LikePostDto) {}
}

@CommandHandler(UpdatePostLikeCommand)
export class UpdatePostLikeUseCase
  implements ICommandHandler<UpdatePostLikeCommand>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly likesPostsRepository: LikesPostsRepository,
  ) {}

  async execute({ dto }: UpdatePostLikeCommand) {
    // 1. Проверка наличия поста (404)
    await this.queryBus.execute<GetPostDocumentQuery, PostDocument>(
      new GetPostDocumentQuery(dto.postId),
    );

    // 2. Выставляем реакцию (UPSERT / DELETE для None)
    await this.likesPostsRepository.setStatus(
      dto.postId,
      dto.authorId,
      dto.likeStatus,
    );
  }
}

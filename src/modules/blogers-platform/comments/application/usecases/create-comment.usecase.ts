import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Comment } from '../../domain/comment.entity';
import { CommentsRepository } from '../../infrastructure/comments.repository';

import { GetPostDocumentQuery } from '../../../posts/application/queries/get-post-document.query';
import { PostDocument } from '../../../posts/domain/post.entity';
import { CreateCommentDto } from '../dto/comment.dto';

export class CreateCommentCommand {
  constructor(public readonly dto: CreateCommentDto) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand, string>
{
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private queryBus: QueryBus,
  ) {}

  async execute({ dto }: CreateCommentCommand): Promise<string> {
    // 1. Проверяем пост через QueryBus
    await this.queryBus.execute<GetPostDocumentQuery, PostDocument>(
      new GetPostDocumentQuery(dto.postId),
    );

    //логин автора больше не нужно «вшивать» в комментарий: при чтении он берётся JOIN-ом из users
    const comment = Comment.createComment(dto);

    await this.commentsRepository.save(comment); //INSERT ... RETURNING id

    return comment.id!;
  }
}

import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostDocument } from '../../domain/post.entity';
import { GetBlogDocumentQuery } from '../../../blogs/application/queries/get-blog-document.query';
import { GetPostDocumentQuery } from '../queries/get-post-document.query';

export class DeletePostCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase implements ICommandHandler<DeletePostCommand> {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly postsRepository: PostsRepository,
  ) {}

  async execute({ id }: DeletePostCommand) {
    const postDocument = await this.queryBus.execute<
      GetBlogDocumentQuery,
      PostDocument
    >(new GetPostDocumentQuery(id));

    postDocument.makeDeleted();

    await this.postsRepository.save(postDocument);
  }
}

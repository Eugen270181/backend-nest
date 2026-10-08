import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostDocument } from '../../domain/post.entity';
import { GetBlogDocumentQuery } from '../../../blogs/application/queries/get-blog-document.query';
import { BlogDocument } from '../../../blogs/domain/blog.entity';
import { GetPostDocumentQuery } from '../queries/get-post-document.query';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class DeletePostCommand {
  constructor(
    public readonly blogId: string,
    public readonly postId: string,
  ) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase implements ICommandHandler<DeletePostCommand> {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly postsRepository: PostsRepository,
  ) {}

  async execute({ blogId, postId }: DeletePostCommand) {
    // 1. Блог из url должен существовать (404)
    await this.queryBus.execute<GetBlogDocumentQuery, BlogDocument>(
      new GetBlogDocumentQuery(blogId),
    );

    // 2. Пост должен существовать и принадлежать именно этому блогу (иначе 404)
    const postDocument = await this.queryBus.execute<
      GetPostDocumentQuery,
      PostDocument
    >(new GetPostDocumentQuery(postId));

    if (postDocument.blogId !== blogId) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `Post ${postId} not found in blog ${blogId}`,
      });
    }

    postDocument.makeDeleted();

    await this.postsRepository.save(postDocument);
  }
}

import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { GetBlogDocumentQuery } from '../queries/get-blog-document.query';
import { BlogDocument } from '../../domain/blog.entity';
import { appConfig } from '../../../../../core/settings/config';

export class DeleteBlogCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase implements ICommandHandler<DeleteBlogCommand> {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly blogsRepository: BlogsRepository,
  ) {
    if (appConfig.IOC_LOG) console.log('DeleteBlogUseCase created');
  }

  async execute({ id }: DeleteBlogCommand): Promise<void> {
    const blogDocument = await this.queryBus.execute<
      GetBlogDocumentQuery,
      BlogDocument
    >(new GetBlogDocumentQuery(id));

    blogDocument.makeDeleted();
    await this.blogsRepository.save(blogDocument);
  }
}

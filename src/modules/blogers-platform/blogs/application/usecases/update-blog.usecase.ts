import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UpdateBlogDto } from '../dto/blog.dto';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { GetBlogDocumentQuery } from '../queries/get-blog-document.query';
import { BlogDocument } from '../../domain/blog.entity';
import { appConfig } from '../../../../../core/settings/config';

export class UpdateBlogCommand {
  constructor(public readonly dto: UpdateBlogDto) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<UpdateBlogCommand> {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly blogsRepository: BlogsRepository,
  ) {
    if (appConfig.IOC_LOG) console.log('UpdateBlogUseCase created');
  }

  async execute({ dto }: UpdateBlogCommand) {
    const blogDocument = await this.queryBus.execute<
      GetBlogDocumentQuery,
      BlogDocument
    >(new GetBlogDocumentQuery(dto.id));

    blogDocument.update(dto);
    await this.blogsRepository.save(blogDocument);
  }
}

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreateBlogDto } from '../dto/blog.dto';
import { CreateBlogDomainDto } from '../../domain/dto/create-blog.domain.dto';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { Blog } from '../../domain/blog.entity';
import { CoreConfig } from '../../../../../core/core.config';

export class CreateBlogCommand {
  constructor(public readonly dto: CreateBlogDto) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase
  implements ICommandHandler<CreateBlogCommand, string>
{
  constructor(
    private coreConfig: CoreConfig,
    private readonly blogsRepository: BlogsRepository,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('CreateBlogUseCase created');
  }

  async execute({ dto }: CreateBlogCommand): Promise<string> {
    const createBlogDomainDto: CreateBlogDomainDto = {
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    };
    const blogDocument = Blog.createBlog(createBlogDomainDto);

    await this.blogsRepository.save(blogDocument);

    //id сгенерировала база и вернула через RETURNING в save()
    return blogDocument.id!;
  }
}

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../../core/settings/config';

import { CreateBlogDto } from '../dto/blog.dto';
import { CreateBlogDomainDto } from '../../domain/dto/create-blog.domain.dto';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../domain/blog.entity';

export class CreateBlogCommand {
  constructor(public readonly dto: CreateBlogDto) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase
  implements ICommandHandler<CreateBlogCommand, string>
{
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
    private readonly blogsRepository: BlogsRepository,
  ) {
    if (appConfig.IOC_LOG) console.log('CreateBlogUseCase created');
  }

  async execute({ dto }: CreateBlogCommand): Promise<string> {
    const createBlogDomainDto: CreateBlogDomainDto = {
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    };
    const blogDocument = this.BlogModel.createBlog(createBlogDomainDto);

    await this.blogsRepository.save(blogDocument);

    return blogDocument._id.toString();
  }
}

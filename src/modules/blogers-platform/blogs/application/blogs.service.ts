import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';
import { CreateBlogDto, UpdateBlogDto } from '../dto/blog.dto';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { Injectable } from '@nestjs/common';
import { CreateBlogDomainDto } from '../domain/dto/create-blog.domain.dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { appConfig } from '../../../../core/settings/config';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name)
    private readonly BlogModel: BlogModelType,
    private readonly blogsRepository: BlogsRepository,
  ) {
    if (appConfig.IOC_LOG) console.log('BlogsService created');
  }

  private async getBlogOrFail(id: string): Promise<BlogDocument> {
    const blogDocument = await this.blogsRepository.findById(id);

    if (!blogDocument) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `Blog with id:${id} - not found`,
      });
    }

    return blogDocument;
  }

  async createBlog(dto: CreateBlogDto): Promise<string> {
    const createBlogDomainDto: CreateBlogDomainDto = {
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    };
    const blogDocument = this.BlogModel.createBlog(createBlogDomainDto);

    await this.blogsRepository.save(blogDocument);

    return blogDocument._id.toString();
  }

  async updateBlog(dto: UpdateBlogDto) {
    const blogDocument = await this.getBlogOrFail(dto.id);

    // не присваиваем св-ва сущностям напрямую в сервисах! даже для изменения одного св-ва
    // создаём метод
    blogDocument.update(dto); // change detection

    await this.blogsRepository.save(blogDocument);
  }

  async deleteBlogById(blogId: string) {
    const blogDocument = await this.getBlogOrFail(blogId);

    blogDocument.makeDeleted();

    await this.blogsRepository.save(blogDocument);
  }
}

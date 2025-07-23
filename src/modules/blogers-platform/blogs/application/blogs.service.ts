import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../domain/blog.entity';
import { CreateBlogDto, UpdateBlogDto } from '../dto/blog.dto';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { Injectable } from '@nestjs/common';
import { CreateBlogDomainDto } from '../domain/dto/create-blog.domain.dto';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name)
    private readonly BlogModel: BlogModelType,
    private readonly blogsRepository: BlogsRepository,
  ) {
    console.log('BlogsService created');
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

  async updateBlog(id: string, dto: UpdateBlogDto): Promise<string> {
    const blogDocument = await this.blogsRepository.findOrNotFoundFail(id);

    // не присваиваем св-ва сущностям напрямую в сервисах! даже для изменения одного св-ва
    // создаём метод
    blogDocument.update(dto); // change detection

    await this.blogsRepository.save(blogDocument);

    return blogDocument._id.toString();
  }

  async deleteBlogById(id: string) {
    const blogDocument = await this.blogsRepository.findOrNotFoundFail(id);

    blogDocument.makeDeleted();

    await this.blogsRepository.save(blogDocument);
  }
}

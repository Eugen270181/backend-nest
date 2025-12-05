import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogsRepository } from '../../blogs/infrastructure/blogs.repository';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { CreatePostDomainDto } from '../domain/dto/create-post.domain.dto';
import { PostModelType, Post, PostDocument } from '../domain/post.entity';
import { PostsRepository } from '../infrastructure/posts.repository';
import { UpdatePostDomainDto } from '../domain/dto/update-post.domain.dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { BlogDocument } from '../../blogs/domain/blog.entity';
import { appConfig } from '../../../../core/settings/config';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private readonly PostModel: PostModelType,
    private readonly blogsRepository: BlogsRepository,
    private readonly postsRepository: PostsRepository,
  ) {
    if (appConfig.IOC_LOG) console.log('PostsService created');
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

  private async getPostOrFail(id: string): Promise<PostDocument> {
    const postDocument = await this.postsRepository.findById(id);

    if (!postDocument) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `Post not found: ${id}`,
      });
    }

    return postDocument;
  }

  async createPost(dto: CreatePostDto): Promise<string> {
    const blogDocument = await this.getBlogOrFail(dto.blogId);

    const createPostDomainDto: CreatePostDomainDto = {
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName: blogDocument.name,
    };
    const postDocument = this.PostModel.createPost(createPostDomainDto);

    await this.postsRepository.save(postDocument);

    return postDocument._id.toString();
  }

  async updatePost(dto: UpdatePostDto) {
    const postDocument = await this.getPostOrFail(dto.id);

    const blogDocument = await this.getBlogOrFail(dto.blogId);

    const updatePostDomainDto: UpdatePostDomainDto = {
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName: blogDocument.name,
    };
    postDocument.update(updatePostDomainDto);

    await this.postsRepository.save(postDocument);
  }

  async deletePostById(id: string) {
    const postDocument = await this.getPostOrFail(id);

    postDocument.makeDeleted();

    await this.postsRepository.save(postDocument);
  }
}

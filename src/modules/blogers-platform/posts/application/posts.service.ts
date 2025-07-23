import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogsRepository } from '../../blogs/infrastructure/blogs.repository';
import { CreatePostDto, UpdatePostDto } from '../dto/post.dto';
import { CreatePostDomainDto } from '../domain/dto/create-post.domain.dto';
import { PostModelType, Post } from '../domain/post.entity';
import { PostsRepository } from '../infrastructure/posts.repository';
import { BlogDocument } from '../../blogs/domain/blog.entity';
import { UpdatePostDomainDto } from '../domain/dto/update-post.domain.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private readonly PostModel: PostModelType,
    private readonly blogsRepository: BlogsRepository,
    private readonly postsRepository: PostsRepository,
  ) {
    console.log('PostsService created');
  }

  async createPost(dto: CreatePostDto): Promise<string> {
    const blogDocument: BlogDocument =
      await this.blogsRepository.findOrNotFoundFail(dto.blogId);

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

  async updatePost(id: string, dto: UpdatePostDto): Promise<string> {
    const postDocument = await this.postsRepository.findOrNotFoundFail(id);

    const blogDocument: BlogDocument =
      await this.blogsRepository.findOrNotFoundFail(dto.blogId);

    const updatePostDomainDto: UpdatePostDomainDto = {
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName: blogDocument.name,
    };
    postDocument.update(updatePostDomainDto);

    await this.postsRepository.save(postDocument);

    return postDocument._id.toString();
  }

  async deletePostById(id: string) {
    const postDocument = await this.postsRepository.findOrNotFoundFail(id);

    postDocument.makeDeleted();

    await this.postsRepository.save(postDocument);
  }
}

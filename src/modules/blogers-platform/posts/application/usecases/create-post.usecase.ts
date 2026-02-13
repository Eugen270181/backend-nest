import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { CreatePostDto } from '../dto/post.dto';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { Post, PostModelType } from '../../domain/post.entity';
import { CreatePostDomainDto } from '../../domain/dto/create-post.domain.dto';
import { GetBlogDocumentQuery } from '../../../blogs/application/queries/get-blog-document.query';
import { BlogDocument } from '../../../blogs/domain/blog.entity';

export class CreatePostCommand {
  constructor(public readonly dto: CreatePostDto) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase
  implements ICommandHandler<CreatePostCommand, string>
{
  constructor(
    @InjectModel(Post.name) private PostModel: PostModelType,
    private postsRepository: PostsRepository,
    private queryBus: QueryBus,
  ) {}

  async execute({ dto }: CreatePostCommand): Promise<string> {
    // 1. Проверяем блог через QueryBus
    const blogDocument = await this.queryBus.execute<
      GetBlogDocumentQuery,
      BlogDocument
    >(new GetBlogDocumentQuery(dto.blogId));

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
}

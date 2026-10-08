import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { CreatePostDto } from '../dto/post.dto';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { Post } from '../../domain/post.entity';
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
    private postsRepository: PostsRepository,
    private queryBus: QueryBus,
  ) {}

  async execute({ dto }: CreatePostCommand): Promise<string> {
    // 1. Проверяем блог через QueryBus
    //blog нужен только для проверки существования (404); blogName считается JOIN-ом при чтении
    await this.queryBus.execute<GetBlogDocumentQuery, BlogDocument>(
      new GetBlogDocumentQuery(dto.blogId),
    );

    const createPostDomainDto: CreatePostDomainDto = {
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
    };

    const postDocument = Post.createPost(createPostDomainDto);
    await this.postsRepository.save(postDocument);
    //id сгенерировала база и вернула через RETURNING в save()
    return postDocument.id!;
  }
}

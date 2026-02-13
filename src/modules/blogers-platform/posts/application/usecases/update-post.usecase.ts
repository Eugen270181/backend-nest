import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UpdatePostDto } from '../dto/post.dto';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostDocument } from '../../domain/post.entity';
import { GetBlogDocumentQuery } from '../../../blogs/application/queries/get-blog-document.query';
import { BlogDocument } from '../../../blogs/domain/blog.entity';
import { UpdatePostDomainDto } from '../../domain/dto/update-post.domain.dto';
import { GetPostDocumentQuery } from '../queries/get-post-document.query';

export class UpdatePostCommand {
  constructor(public readonly dto: UpdatePostDto) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly postsRepository: PostsRepository,
  ) {}

  async execute({ dto }: UpdatePostCommand) {
    const postDocument = await this.queryBus.execute<
      GetPostDocumentQuery,
      PostDocument
    >(new GetPostDocumentQuery(dto.postId));

    const blogDocument = await this.queryBus.execute<
      GetBlogDocumentQuery,
      BlogDocument
    >(new GetBlogDocumentQuery(dto.blogId));

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
}

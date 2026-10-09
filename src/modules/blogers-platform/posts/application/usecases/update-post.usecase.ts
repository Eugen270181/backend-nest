import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UpdatePostDto } from '../dto/post.dto';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostDocument } from '../../domain/post.entity';
import { GetBlogDocumentQuery } from '../../../blogs/application/queries/get-blog-document.query';
import { BlogDocument } from '../../../blogs/domain/blog.entity';
import { UpdatePostDomainDto } from '../../domain/dto/update-post.domain.dto';
import { GetPostDocumentQuery } from '../queries/get-post-document.query';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

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
    // 1. Блог из url должен существовать (404)
    await this.queryBus.execute<GetBlogDocumentQuery, BlogDocument>(
      new GetBlogDocumentQuery(dto.blogId),
    );

    // 2. Пост должен существовать и принадлежать именно этому блогу (иначе 404)
    const postDocument = await this.queryBus.execute<
      GetPostDocumentQuery,
      PostDocument
    >(new GetPostDocumentQuery(dto.postId));

    if (postDocument.blogId !== dto.blogId) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `Post ${dto.postId} not found in blog ${dto.blogId}`,
      });
    }

    const updatePostDomainDto: UpdatePostDomainDto = {
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
    };
    postDocument.update(updatePostDomainDto);

    await this.postsRepository.save(postDocument);
  }
}

import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../../domain/comment.entity';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { UsersRepository } from '../../../../user-accounts/infrastructure/users.repository';

import { GetPostDocumentQuery } from '../../../posts/application/queries/get-post-document.query';
import { CreateCommentDto } from '../dto/comment.dto';

export class CreateCommentCommand {
  constructor(public readonly dto: CreateCommentDto) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand, string>
{
  constructor(
    @InjectModel(Comment.name)
    private readonly CommentModel: CommentModelType,
    private readonly commentsRepository: CommentsRepository,
    private readonly usersRepository: UsersRepository,
    private queryBus: QueryBus,
  ) {}

  async execute({ dto }: CreateCommentCommand): Promise<string> {
    // 1. Проверяем пост через QueryBus
    await this.queryBus.execute<GetPostDocumentQuery, CommentDocument>(
      new GetPostDocumentQuery(dto.postId),
    );

    const userDocument = await this.usersRepository.findById(dto.userId);
    const userLogin = userDocument!.login;
    const createCommentDomainDto = { ...dto, userLogin };
    const commentDocument: CommentDocument = this.CommentModel.createComment(
      createCommentDomainDto,
    );

    await this.commentsRepository.save(commentDocument);

    return commentDocument._id.toString();
  }
}

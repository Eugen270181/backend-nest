import { Injectable } from '@nestjs/common';
import { CommentsRepository } from '../infrastructure/comments.repository';
import { appConfig } from '../../../../core/settings/config';

import { CreateCommentDto } from './dto/comment.dto';

import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { CreateCommentDomainDto } from '../domain/dto/create-comment.domain.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/comment.entity';
import { UsersRepository } from '../../../user-accounts/infrastructure/users.repository';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name)
    private readonly CommentModel: CommentModelType,
    private readonly commentsRepository: CommentsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly usersRepository: UsersRepository,
  ) {
    if (appConfig.IOC_LOG) console.log('CommentsService created');
  }
  //TODO delete, put by Id, put like-status by Id...
  private async checkPostOrFail(id: string) {
    const postDocument = await this.postsRepository.findById(id);

    if (!postDocument) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `Post not found: ${id}`,
      });
    }

    //return postDocument;
  }

  async createComment(dto: CreateCommentDto): Promise<string> {
    await this.checkPostOrFail(dto.postId);

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

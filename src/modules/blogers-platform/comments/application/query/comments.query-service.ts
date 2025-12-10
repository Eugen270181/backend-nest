import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { appConfig } from '../../../../../core/settings/config';
import { CommentsQueryRepository } from '../../infrastructure/query/comments.query-repository';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { GetCommentsQueryParams } from '../../../posts/api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';
import { LikesCommentsRepository } from '../../../likes/infrastructure/likes-comments.repository';

@Injectable()
export class CommentsQueryService {
  constructor(
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly likesCommentsRepository: LikesCommentsRepository,
    private readonly postsRepository: PostsRepository,
  ) {
    if (appConfig.IOC_LOG) console.log('CommentsQueryService created');
  }

  private async checkPostOrFail(id: string) {
    const postDocument = await this.postsRepository.findById(id);

    if (!postDocument) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `post not found: ${id}`,
      });
    }
  }

  // ✅ Переиспользуемый метод
  private async enrichCommentWithLikes(
    commentViewDto: CommentViewDto,
    userId?: string,
  ): Promise<CommentViewDto> {
    if (!userId) return commentViewDto;

    const myLike =
      await this.likesCommentsRepository.findLikeCommentByAuthorIdAndCommentId(
        userId,
        commentViewDto.id,
      );

    commentViewDto.setMyLikeStatus(myLike?.likeStatus ?? LikeStatus.None);
    return commentViewDto;
  }

  async getById(id: string, userId?: string): Promise<CommentViewDto | null> {
    const comment = await this.commentsQueryRepository.getById(id);
    if (!comment) return null;

    return this.enrichCommentWithLikes(comment, userId);
  }
  /////////////////////////////////////////////////////////////////////////////////
  async getCommentViewDtoOrFail(
    id: string,
    userId?: string,
    justCreated: boolean = false,
  ): Promise<CommentViewDto> {
    const commentViewDto = await this.getById(id, userId); // ✅ Уже обогащено

    if (!commentViewDto) {
      if (!justCreated) {
        throw new DomainException({
          code: DomainExceptionCode.NotFound,
          message: `Comment with id:${id} - Not found`,
        });
      }
      throw new Error(`Just Created Comment with id:${id} - Not found`);
    }

    return commentViewDto;
  }

  async getPostComments(
    query: GetCommentsQueryParams,
    postId: string,
    userId?: string,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    await this.checkPostOrFail(postId); // ✅ Добавьте проверку поста

    const paginated = await this.commentsQueryRepository.getPostComments(
      query,
      postId,
    );

    if (!userId) return paginated;

    // ✅ Переиспользуем метод параллельно
    paginated.items = await Promise.all(
      paginated.items.map((comment) =>
        this.enrichCommentWithLikes(comment, userId),
      ),
    );

    return paginated;
  }
}

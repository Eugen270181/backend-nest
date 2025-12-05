import { InjectModel } from '@nestjs/mongoose';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LikeComment,
  LikeCommentDocument,
  LikeCommentModelType,
} from '../domain/like-comment.entity';
import { UsersRepository } from '../../../user-accounts/infrastructure/users.repository';
import { CommentsRepository } from '../../comments/infrastructure/comments.repository';
import { LikeCommentInputDto } from '../../comments/api/input-dto/like-comment.input-dto';
import { LikeStatus } from '../../../../core/dto/enum/like-status.enum';
import { LikesCommentsRepository } from '../infrastructure/likes-comments.repository';
import { LikeCommentDto } from './dto/like-comment.dto';
import { LikePost, LikePostModelType } from '../domain/like-post.entity';
import { LikePostDto } from './dto/like-post.dto';
import { LikesPostsRepository } from '../infrastructure/likes-posts.repository';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';

@Injectable()
export class LikesPostsService {
  constructor(
    @InjectModel(LikePost.name)
    private readonly LikePostModel: LikePostModelType,
    private usersRepository: UsersRepository,
    private postsRepository: PostsRepository,
    private likesPostsRepository: LikesPostsRepository,
  ) {}

  async updatePost(dto: LikePostDto): Promise<LikeStatus | null> {
    const likePostDocument =
      await this.likesPostsRepository.findLikePostByAuthorIdAndPostId(
        dto.authorId,
        dto.postId,
      );

    const oldStatus = likePostDocument?.likeStatus ?? LikeStatus.None;
    if (dto.likeStatus === oldStatus) return null; //не обновляем пост

    if (likePostDocument) {
      likePostDocument.update(dto.likeStatus);
      await likePostDocument.save();
    } else {
      const newLikePostDocument = await this.LikePostModel.create(dto);
      await this.likesPostsRepository.save(newLikePostDocument);
    }

    return oldStatus; // ✅ Возвращаем для PostsService
  }
}

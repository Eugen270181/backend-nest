import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../../user-accounts/infrastructure/users.repository';
import { LikeStatus } from '../../../../core/dto/enum/like-status.enum';
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

  async updateLike(dto: LikePostDto): Promise<LikeStatus | null> {
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
      //2. Обогощаем входную дто логином, все для того, чтобы при выборке лайков не надо было для каждого лайка искать логин
      const userDocument = await this.usersRepository.findById(dto.authorId);
      const authorLogin = userDocument!.login;
      const createLikePostDomainDto = { ...dto, authorLogin };
      const newLikePostDocument = this.LikePostModel.createLikePost(
        createLikePostDomainDto,
      );

      await this.likesPostsRepository.save(newLikePostDocument);
    }

    return oldStatus; // ✅ Возвращаем для PostsService
  }
}

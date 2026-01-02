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
    private likesPostsRepository: LikesPostsRepository,
  ) {}

  async updateLike(dto: LikePostDto): Promise<LikeStatus | null> {
    console.log(dto);
    const likePostDocument =
      await this.likesPostsRepository.findLikePostByAuthorIdAndPostId(
        dto.authorId,
        dto.postId,
      );
    console.log(likePostDocument);
    const oldStatus = likePostDocument?.likeStatus ?? LikeStatus.None;
    if (dto.likeStatus === oldStatus) return null; //не обновляем пост
    console.log(dto.likeStatus);
    if (likePostDocument) {
      likePostDocument.update(dto.likeStatus);
      await likePostDocument.save();
    } else {
      //2. Обогощаем входную дто логином, все для того, чтобы при выборке лайков не надо было для каждого лайка искать логин
      const userDocument = await this.usersRepository.findById(dto.authorId);
      const authorLogin = userDocument!.login;
      console.log(authorLogin);
      const createLikePostDomainDto = { ...dto, authorLogin };
      const newLikePostDocument = this.LikePostModel.createLikePost(
        createLikePostDomainDto,
      );
      console.log(newLikePostDocument);
      await this.likesPostsRepository.save(newLikePostDocument);
    }

    return oldStatus; // ✅ Возвращаем для PostsService
  }
}

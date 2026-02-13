import { LikePostDto } from '../dto/like-post.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { LikePost, LikePostModelType } from '../../domain/like-post.entity';
import { UsersRepository } from '../../../../user-accounts/infrastructure/users.repository';
import { LikesPostsRepository } from '../../infrastructure/likes-posts.repository';
import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';

export class UpdateLikePostCommand {
  constructor(public readonly dto: LikePostDto) {}
}

@CommandHandler(UpdateLikePostCommand)
export class UpdateLikePostUseCase
  implements ICommandHandler<UpdateLikePostCommand, LikeStatus | null>
{
  constructor(
    @InjectModel(LikePost.name)
    private readonly LikePostModel: LikePostModelType,
    private usersRepository: UsersRepository,
    private likesPostsRepository: LikesPostsRepository,
  ) {}

  async execute({ dto }: UpdateLikePostCommand): Promise<LikeStatus | null> {
    const likePostDocument =
      await this.likesPostsRepository.findLikePostByAuthorIdAndPostId(
        dto.authorId,
        dto.postId,
      );

    const oldStatus = likePostDocument?.likeStatus ?? LikeStatus.None;

    if (dto.likeStatus === oldStatus) return null; // не будем обновлять статус лайка поста

    if (likePostDocument) {
      likePostDocument.update(dto.likeStatus);
      await likePostDocument.save();
    } else {
      //Обогощаем входную дто логином, все для того, чтобы при выборке лайков не надо было для каждого лайка искать логин
      const userDocument = await this.usersRepository.findById(dto.authorId);
      const authorLogin = userDocument!.login;

      const createLikePostDomainDto = { ...dto, authorLogin };
      const newLikePostDocument = this.LikePostModel.createLikePost(
        createLikePostDomainDto,
      );

      await this.likesPostsRepository.save(newLikePostDocument);
    }

    return oldStatus; // Возвращаем старый статус лайка
  }
}

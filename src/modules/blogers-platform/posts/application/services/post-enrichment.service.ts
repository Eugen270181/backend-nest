import { LikeStatus } from '../../../../../core/dto/enum/like-status.enum';
import { Injectable } from '@nestjs/common';
import { LikesPostsRepository } from '../../../likes/infrastructure/likes-posts.repository';
import { PostViewDto } from '../../api/view-dto/post.view-dto';

@Injectable()
export class PostEnrichmentService {
  constructor(private readonly likesPostsRepository: LikesPostsRepository) {}

  async enrich(
    postViewDto: PostViewDto,
    userId?: string,
  ): Promise<PostViewDto> {
    const newestLikes = await this.likesPostsRepository.getNewestLikes(
      postViewDto.id,
      3,
    );

    let myStatus = LikeStatus.None;
    if (userId) {
      const myLike =
        await this.likesPostsRepository.findLikePostByAuthorIdAndPostId(
          userId,
          postViewDto.id,
        );
      myStatus = myLike?.likeStatus ?? LikeStatus.None;
      postViewDto.setMyLikeStatus(myStatus);
    }

    postViewDto.enrichWithNewestLikes(newestLikes);
    return postViewDto;
  }
}

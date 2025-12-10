import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogsRepository } from '../../blogs/infrastructure/blogs.repository';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { CreatePostDomainDto } from '../domain/dto/create-post.domain.dto';
import { PostModelType, Post, PostDocument } from '../domain/post.entity';
import { PostsRepository } from '../infrastructure/posts.repository';
import { UpdatePostDomainDto } from '../domain/dto/update-post.domain.dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { BlogDocument } from '../../blogs/domain/blog.entity';
import { appConfig } from '../../../../core/settings/config';
import { LikeCommentDto } from '../../likes/application/dto/like-comment.dto';
import { LikePostDto } from '../../likes/application/dto/like-post.dto';
import { LikesPostsService } from '../../likes/application/likes-posts.service';
import { LikeStatus } from '../../../../core/dto/enum/like-status.enum';
import { UsersRepository } from '../../../user-accounts/infrastructure/users.repository';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private readonly PostModel: PostModelType,
    private readonly usersRepository: UsersRepository,
    private readonly blogsRepository: BlogsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly likesPostsService: LikesPostsService,
  ) {
    if (appConfig.IOC_LOG) console.log('PostsService created');
  }

  private async getBlogOrFail(id: string): Promise<BlogDocument> {
    const blogDocument = await this.blogsRepository.findById(id);

    if (!blogDocument) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `Blog with id:${id} - not found`,
      });
    }

    return blogDocument;
  }

  private async getPostOrFail(id: string): Promise<PostDocument> {
    const postDocument = await this.postsRepository.findById(id);

    if (!postDocument) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `Post not found: ${id}`,
      });
    }

    return postDocument;
  }

  private async updateLikeCounters(
    oldLikeStatus: LikeStatus,
    newLikeStatus: LikeStatus,
    postId: string,
  ) {
    const postDocument = await this.postsRepository.findById(postId);
    if (!postDocument) return;
    if (oldLikeStatus === newLikeStatus) return;

    if (oldLikeStatus === LikeStatus.None) {
      if (newLikeStatus === LikeStatus.Like) {
        postDocument.incrementLikes();
      } else if (newLikeStatus === LikeStatus.Dislike) {
        postDocument.incrementDislikes();
      }
    }

    if (oldLikeStatus === LikeStatus.Like) {
      postDocument.decrementLikes();
      if (newLikeStatus === LikeStatus.Dislike) {
        postDocument.incrementDislikes();
      }
    }

    if (oldLikeStatus === LikeStatus.Dislike) {
      postDocument.decrementDislikes();
      if (newLikeStatus === LikeStatus.Like) {
        postDocument.incrementLikes();
      }
    }

    await postDocument.save();
  }

  async createPost(dto: CreatePostDto): Promise<string> {
    const blogDocument = await this.getBlogOrFail(dto.blogId);

    const createPostDomainDto: CreatePostDomainDto = {
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName: blogDocument.name,
    };
    const postDocument = this.PostModel.createPost(createPostDomainDto);

    await this.postsRepository.save(postDocument);

    return postDocument._id.toString();
  }

  async updatePost(dto: UpdatePostDto) {
    const postDocument = await this.getPostOrFail(dto.postId);

    const blogDocument = await this.getBlogOrFail(dto.blogId);

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

  async updateLike(dto: LikePostDto): Promise<void> {
    // 1. Проверка поста
    const postDocument = await this.postsRepository.findById(dto.postId);
    if (!postDocument) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }

    // 2. ✅ Делегируем создание/обновление лайка
    const oldStatus = await this.likesPostsService.updateLike(dto);
    if (!oldStatus) return; //если обновление не произошло

    // 3. ✅ Сами обновляем счетчики
    await this.updateLikeCounters(oldStatus, dto.likeStatus, dto.postId);
  }

  async deletePostById(id: string) {
    const postDocument = await this.getPostOrFail(id);

    postDocument.makeDeleted();

    await this.postsRepository.save(postDocument);
  }
}

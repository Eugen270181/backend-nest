import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { BlogsRepository } from './blogs/infrastructure/blogs.repository';
import { BlogsController } from './blogs/api/blogs.controller';
import { BlogsQueryRepository } from './blogs/infrastructure/query/blogs.query-repository';
import { BlogsService } from './blogs/application/blogs.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { PostsController } from './posts/api/posts.controller';
import { Post, PostSchema } from './posts/domain/post.entity';
import { PostsService } from './posts/application/posts.service';
import { PostsRepository } from './posts/infrastructure/posts.repository';
import { PostsQueryRepository } from './posts/infrastructure/query/posts.query-repository';
import { Comment, CommentSchema } from './comments/domain/comment.entity';
import { CommentsService } from './comments/application/comments.service';
import { CommentsRepository } from './comments/infrastructure/comments.repository';
import { CommentsQueryRepository } from './comments/infrastructure/query/comments.query-repository';
import { CommentsController } from './comments/api/comments.controller';
import { BlogsQueryService } from './blogs/application/query/blogs.query-service';
import { PostsQueryService } from './posts/application/query/posts.query-service';
import { CommentsQueryService } from './comments/application/query/comments.query-service';
import { OptionalJwtMiddleware } from '../user-accounts/middlewares/optional-jwt.middleware';
import {
  LikeComment,
  LikeCommentSchema,
} from './likes/domain/like-comment.entity';
import { LikesCommentsService } from './likes/application/likes-comments.service';
import { LikesCommentsRepository } from './likes/infrastructure/likes-comments.repository';
import { LikesPostsService } from './likes/application/likes-posts.service';
import { LikesPostsRepository } from './likes/infrastructure/likes-posts.repository';
import { LikePost, LikePostSchema } from './likes/domain/like-post.entity';

//тут регистрируем провайдеры всех сущностей блоггерской платформы (blogs, posts, comments, etc...)
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: LikeComment.name, schema: LikeCommentSchema },
      { name: LikePost.name, schema: LikePostSchema },
    ]),
    UserAccountsModule,
  ],
  controllers: [BlogsController, PostsController, CommentsController],
  providers: [
    BlogsService,
    BlogsQueryService,
    BlogsRepository,
    BlogsQueryRepository,
    PostsService,
    PostsQueryService,
    PostsRepository,
    PostsQueryRepository,
    LikesPostsService,
    LikesPostsRepository,
    CommentsService,
    CommentsQueryService,
    CommentsRepository,
    CommentsQueryRepository,
    LikesCommentsService,
    LikesCommentsRepository,
    //OptionalJwtMiddleware,
  ],
})
export class BloggersPlatformModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(OptionalJwtMiddleware).forRoutes(
      { path: 'posts/*', method: RequestMethod.GET },
      { path: 'comments/*', method: RequestMethod.GET },
      // ✅ Добавляй новые по мере необходимости
    );
  }
}

import { Module } from '@nestjs/common';
import { BlogsRepository } from './blogs/infrastructure/blogs.repository';
import { BlogsController } from './blogs/api/blogs.controller';
import { BlogsQueryRepository } from './blogs/infrastructure/query/blogs.query-repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { PostsController } from './posts/api/posts.controller';
import { Post, PostSchema } from './posts/domain/post.entity';
import { PostsRepository } from './posts/infrastructure/posts.repository';
import { PostsQueryRepository } from './posts/infrastructure/query/posts.query-repository';
import { Comment, CommentSchema } from './comments/domain/comment.entity';
import { CommentsRepository } from './comments/infrastructure/comments.repository';
import { CommentsQueryRepository } from './comments/infrastructure/query/comments.query-repository';
import { CommentsController } from './comments/api/comments.controller';

import {
  LikeComment,
  LikeCommentSchema,
} from './likes/domain/like-comment.entity';
import { LikesCommentsRepository } from './likes/infrastructure/likes-comments.repository';
import { LikesPostsRepository } from './likes/infrastructure/likes-posts.repository';
import { LikePost, LikePostSchema } from './likes/domain/like-post.entity';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateBlogUseCase } from './blogs/application/usecases/create-blog.usecase';
import { GetBlogQueryHandler } from './blogs/application/queries/get-blog.query';
import { UpdateBlogUseCase } from './blogs/application/usecases/update-blog.usecase';
import { GetBlogDocumentQueryHandler } from './blogs/application/queries/get-blog-document.query';
import { DeleteBlogUseCase } from './blogs/application/usecases/delete-blog.usecase';
import { GetAllBlogsQueryHandler } from './blogs/application/queries/get-all-blogs.query';
import { GetPostQueryHandler } from './posts/application/queries/get-post.query';
import { GetPostDocumentQueryHandler } from './posts/application/queries/get-post-document.query';
import { CreatePostUseCase } from './posts/application/usecases/create-post.usecase';
import { PostEnrichmentService } from './posts/application/services/post-enrichment.service';
import { GetAllPostsQueryHandler } from './posts/application/queries/get-all-posts.query';
import { UpdatePostUseCase } from './posts/application/usecases/update-post.usecase';
import { DeletePostUseCase } from './posts/application/usecases/delete-post.usecase';
import { GetBlogPostsQueryHandler } from './posts/application/queries/get-blog-posts.query';
import { UpdatePostLikeUseCase } from './posts/application/usecases/update-post-like.usecase';
import { UpdateLikePostUseCase } from './likes/application/usecases/update-like-post.usecase';

import { GetCommentDocumentQueryHandler } from './comments/application/queries/get-comment-document.query';
import { UpdateLikeCommentUseCase } from './likes/application/usecases/update-like-comment.usecase';
import { GetCommentQueryHandler } from './comments/application/queries/get-comment.query';
import { CreateCommentUseCase } from './comments/application/usecases/create-comment.usecase';
import { UpdateCommentUseCase } from './comments/application/usecases/update-comment.usecase';
import { DeleteCommentUseCase } from './comments/application/usecases/delete-comment.usecase';
import { CommentEnrichmentService } from './comments/application/services/comment-enrichment.service';
import { UpdateCommentLikeUseCase } from './comments/application/usecases/update-comment-like.usecase';
import { GetPostCommentsQueryHandler } from './comments/application/queries/get-post-comments.query';

const commandHandlers = [
  CreateBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogUseCase,
  CreatePostUseCase,
  UpdatePostUseCase,
  UpdatePostLikeUseCase,
  DeletePostUseCase,
  CreateCommentUseCase,
  UpdateCommentUseCase,
  UpdateCommentLikeUseCase,
  DeleteCommentUseCase,
  UpdateLikePostUseCase,
  UpdateLikeCommentUseCase,
];
const queryHandlers = [
  GetBlogQueryHandler,
  GetAllBlogsQueryHandler,
  GetBlogDocumentQueryHandler,
  GetPostQueryHandler,
  GetAllPostsQueryHandler,
  GetBlogPostsQueryHandler,
  GetPostDocumentQueryHandler,
  GetCommentQueryHandler,
  GetPostCommentsQueryHandler,
  GetCommentDocumentQueryHandler,
];
const services = [PostEnrichmentService, CommentEnrichmentService];

//тут регистрируем провайдеры всех сущностей блоггерской платформы (blogs, posts, comments, etc...)
@Module({
  imports: [
    CqrsModule,
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
    ...commandHandlers,
    ...queryHandlers,
    ...services,
    BlogsRepository,
    BlogsQueryRepository,
    PostsRepository,
    PostsQueryRepository,
    CommentsRepository,
    CommentsQueryRepository,
    LikesPostsRepository,
    LikesCommentsRepository,
    //OptionalJwtMiddleware,
  ],
})
export class BloggersPlatformModule {}
//implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(OptionalJwtMiddleware).forRoutes(
//       // ✅ Фикс для GET /posts
//       { path: 'posts', method: RequestMethod.GET },
//       { path: 'posts/*', method: RequestMethod.GET },
//
//       // ✅ Фикс для блогов
//       { path: 'blogs/:blogId/posts', method: RequestMethod.GET },
//
//       // ✅ Комменты уже есть
//       { path: 'comments/*', method: RequestMethod.GET },
//       // ✅ Добавляй новые по мере необходимости
//     );
//   }
// }

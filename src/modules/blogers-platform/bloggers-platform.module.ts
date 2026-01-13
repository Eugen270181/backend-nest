import { Module } from '@nestjs/common';
import { BlogsRepository } from './blogs/infrastructure/blogs.repository';
import { BlogsController } from './blogs/api/blogs.controller';
import { BlogsQueryRepository } from './blogs/infrastructure/query/blogs.query-repository';
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
import { PostsQueryService } from './posts/application/query/posts.query-service';
import { CommentsQueryService } from './comments/application/query/comments.query-service';

import {
  LikeComment,
  LikeCommentSchema,
} from './likes/domain/like-comment.entity';
import { LikesCommentsService } from './likes/application/likes-comments.service';
import { LikesCommentsRepository } from './likes/infrastructure/likes-comments.repository';
import { LikesPostsService } from './likes/application/likes-posts.service';
import { LikesPostsRepository } from './likes/infrastructure/likes-posts.repository';
import { LikePost, LikePostSchema } from './likes/domain/like-post.entity';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateBlogUseCase } from './blogs/application/usecases/create-blog.usecase';
import { GetBlogQueryHandler } from './blogs/application/queries/get-blog.query';
import { UpdateBlogUseCase } from './blogs/application/usecases/update-blog.usecase';
import { GetBlogDocumentQueryHandler } from './blogs/application/queries/get-blog-document.query';
import { DeleteBlogUseCase } from './blogs/application/usecases/delete-blog.usecase';

const services = [
  PostsService,
  PostsQueryService,
  LikesPostsService,
  CommentsService,
  CommentsQueryService,
  LikesCommentsService,
];

const commandHandlers = [
  CreateBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogUseCase,
];
const queryHandlers = [GetBlogQueryHandler, GetBlogDocumentQueryHandler];

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

import { Module } from '@nestjs/common';
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

//тут регистрируем провайдеры всех сущностей блоггерской платформы (blogs, posts, comments, etc...)
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
    UserAccountsModule,
  ],
  controllers: [BlogsController, PostsController, CommentsController],
  providers: [
    BlogsService,
    BlogsRepository,
    BlogsQueryRepository,
    PostsService,
    PostsRepository,
    PostsQueryRepository,
    CommentsService,
    CommentsRepository,
    CommentsQueryRepository,
  ],
})
export class BloggersPlatformModule {}

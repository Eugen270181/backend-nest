# 🔍 КОД КОНТРОЛЛЕРА - ЧТО НУЖНО ПРОВЕРИТЬ И ИСПРАВИТЬ

## ⚠️ Проблема в контроллере

Если тесты не проходят, вероятно в вашем контроллере есть одна из этих проблем:

## ✅ ПРАВИЛЬНЫЙ КОНТРОЛЛЕР ПОСТОВ

### 1️⃣ Получение постов (GET /posts)

```typescript
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @UseGuards(JwtAuthGuard) // ← Опциональный гвард (пользователь может быть и не авторизован)
  async getPosts(
    @Query() query: GetPostsQueryDto,
    @CurrentUser() currentUser?: UserInfoDto, // ← КЛЮЧЕВОЙ МОМЕНТ!
  ) {
    // currentUser может быть undefined, если пользователь не авторизован
    // Но если он авторизован, то будет содержать информацию о пользователе
    const userId = currentUser?.id;

    return this.postsService.getPosts(query, userId); // ← Передаём userId!
  }
}
```

### 2️⃣ Получение постов блога (GET /blogs/:blogId/posts)

```typescript
@Controller('blogs')
export class BlogsController {
  constructor(private readonly postsService: PostsService) {}

  @Get(':blogId/posts')
  @UseGuards(JwtAuthGuard) // ← Опциональный гвард
  async getBlogPosts(
    @Param('blogId') blogId: string,
    @Query() query: GetPostsQueryDto,
    @CurrentUser() currentUser?: UserInfoDto, // ← КЛЮЧЕВОЙ МОМЕНТ!
  ) {
    const userId = currentUser?.id;

    return this.postsService.getBlogPosts(blogId, query, userId); // ← Передаём userId!
  }
}
```

## ✅ ПРАВИЛЬНЫЙ СЕРВИС

### 3️⃣ Service метод для получения постов

```typescript
import { Injectable } from '@nestjs/common';
import { PostModel } from 'src/db/schemas/post.schema';

@Injectable()
export class PostsService {
  async getPosts(query: GetPostsQueryDto, userId?: string) {
    const { pageNumber = 1, pageSize = 10, sortBy = 'createdAt', sortDirection = 'desc' } = query;

    const skip = (pageNumber - 1) * pageSize;

    // Получить посты из БД
    const posts = await PostModel.find()
      .sort({ [sortBy]: sortDirection === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const totalCount = await PostModel.countDocuments();

    // ← КЛЮЧЕВОЙ МОМЕНТ: Обогатить каждый пост информацией о лайках текущего пользователя
    const items = await Promise.all(
      posts.map((post) => this.enrichPostWithLikesInfo(post, userId)),
    );

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: items,
    };
  }

  async getBlogPosts(blogId: string, query: GetPostsQueryDto, userId?: string) {
    const { pageNumber = 1, pageSize = 10, sortBy = 'createdAt', sortDirection = 'desc' } = query;

    const skip = (pageNumber - 1) * pageSize;

    // Получить посты этого блога
    const posts = await PostModel.find({ blogId })
      .sort({ [sortBy]: sortDirection === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const totalCount = await PostModel.countDocuments({ blogId });

    // ← Обогатить каждый пост информацией о лайках
    const items = await Promise.all(
      posts.map((post) => this.enrichPostWithLikesInfo(post, userId)),
    );

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: items,
    };
  }

  // ← САМЫЙ ВАЖНЫЙ МЕТОД!
  private async enrichPostWithLikesInfo(post: any, userId?: string) {
    // Получить все лайки и дизлайки для этого поста
    const likes = await LikeModel.find({
      postId: post._id,
      status: 'Like',
    });

    const dislikes = await LikeModel.find({
      postId: post._id,
      status: 'Dislike',
    });

    // Определить myStatus - лайкал ли текущий пользователь этот пост?
    let myStatus = 'None'; // По умолчанию
    if (userId) {
      const userLike = await LikeModel.findOne({
        postId: post._id,
        userId: userId,
      });

      if (userLike) {
        myStatus = userLike.status === 'Like' ? 'Like' : 'Dislike';
      }
    }

    // Получить 3 самых свежих лайка (отсортированы по убыванию)
    const newestLikes = likes
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 3)
      .map((like) => ({
        addedAt: like.addedAt.toISOString(), // ← ISO формат!
        userId: like.userId.toString(),
        login: like.userLogin, // Должен быть сохранён в БД
      }));

    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId.toString(),
      blogName: post.blogName,
      createdAt: post.createdAt.toISOString(), // ← ISO формат!
      extendedLikesInfo: {
        likesCount: likes.length,
        dislikesCount: dislikes.length,
        myStatus: myStatus, // ← КЛЮЧЕВОЙ МОМЕНТ!
        newestLikes: newestLikes, // ← КЛЮЧЕВОЙ МОМЕНТ!
      },
    };
  }
}
```

## ✅ ПРАВИЛЬНЫЙ JWT ГВАРД

### 4️⃣ JWT Auth Guard (опциональный вариант)

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Если нет заголовка Authorization, всё равно разрешить (пользователь может быть не авторизован)
    if (!authHeader) {
      request.user = undefined;
      return true;
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      const decoded = this.jwtService.verify(token);
      request.user = decoded;
      return true;
    } catch (error) {
      // Если токен неправильный, тоже разрешить (просто как гость)
      request.user = undefined;
      return true;
    }
  }
}
```

## ✅ ПРАВИЛЬНЫЙ ДЕКОРАТОР

### 5️⃣ CurrentUser Decorator

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // ← Может быть undefined!
  },
);
```

## ✅ ПРАВИЛЬНАЯ SCHEMA

### 6️⃣ Like/Dislike Schema

```typescript
import { Schema, Document, model } from 'mongoose';

const LikeSchema = new Schema({
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  commentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userLogin: { type: String, required: true }, // ← ВАЖНО! Сохраняем login для быстрого доступа
  status: {
    type: String,
    enum: ['Like', 'Dislike', 'None'],
    default: 'None',
  },
  addedAt: { type: Date, default: () => new Date() },
});

export const LikeModel = model('Like', LikeSchema);
```

## ❌ ЧАСТЫЕ ОШИБКИ И ИСПРАВЛЕНИЯ

### Ошибка 1: currentUser не передаётся в сервис

```typescript
// ❌ НЕПРАВИЛЬНО
@Get()
getPosts(@Query() query: GetPostsQueryDto) {
  // currentUser потеряется!
  return this.postsService.getPosts(query);
}

// ✅ ПРАВИЛЬНО
@Get()
getPosts(
  @Query() query: GetPostsQueryDto,
  @CurrentUser() currentUser?: UserInfoDto,
) {
  const userId = currentUser?.id;
  return this.postsService.getPosts(query, userId);
}
```

### Ошибка 2: Забыли сохранить userLogin при создании like

```typescript
// ❌ НЕПРАВИЛЬНО
const like = new LikeModel({
  postId,
  userId,
  status: 'Like',
  addedAt: new Date(),
});
// userLogin потеряется!

// ✅ ПРАВИЛЬНО
const like = new LikeModel({
  postId,
  userId,
  userLogin: user.login, // ← ДОБАВИТЬ!
  status: 'Like',
  addedAt: new Date(),
});
```

### Ошибка 3: Не сортируются newestLikes

```typescript
// ❌ НЕПРАВИЛЬНО
const newestLikes = likes.map((like) => ({
  addedAt: like.addedAt,
  userId: like.userId,
  login: like.userLogin,
}));

// ✅ ПРАВИЛЬНО
const newestLikes = likes
  .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
  .slice(0, 3)
  .map((like) => ({
    addedAt: like.addedAt.toISOString(),
    userId: like.userId.toString(),
    login: like.userLogin,
  }));
```

### Ошибка 4: myStatus всегда 'None'

```typescript
// ❌ НЕПРАВИЛЬНО - userId не передаётся
const myStatus = 'None'; // Всегда!

// ✅ ПРАВИЛЬНО
let myStatus = 'None';
if (userId) {
  const userLike = await LikeModel.findOne({
    postId: post._id,
    userId: userId,
  });
  if (userLike) {
    myStatus = userLike.status === 'Like' ? 'Like' : 'Dislike';
  }
}
```

### Ошибка 5: newestLikes всегда пусто

```typescript
// ❌ НЕПРАВИЛЬНО
const likes = await LikeModel.find({
  postId: post._id,
  status: 'Dislike', // ← Получили только дизлайки!
});

// ✅ ПРАВИЛЬНО
const likes = await LikeModel.find({
  postId: post._id,
  status: 'Like', // ← Получим лайки!
});
```

## 🧪 Тестирование контроллера

Перед запуском тестов проверьте:

```typescript
// 1. Создан пост
const post = await PostModel.findById(postId);
expect(post).toBeDefined();

// 2. Создан лайк
const like = await LikeModel.findOne({ postId, userId });
expect(like).toBeDefined();
expect(like.status).toBe('Like');
expect(like.userLogin).toBeDefined(); // ← Проверить!

// 3. При запросе постов с userId:
const result = await service.getPosts(query, userId);
expect(result.items[0].extendedLikesInfo.myStatus).toBe('Like');
expect(result.items[0].extendedLikesInfo.newestLikes).toHaveLength(1);

// 4. При запросе постов без userId:
const resultNoAuth = await service.getPosts(query);
expect(result.items[0].extendedLikesInfo.myStatus).toBe('None');
```

## 📋 Чек-лист перед отправкой

- [ ] currentUser передаётся в сервис
- [ ] userId передаётся методу enrichPostWithLikesInfo
- [ ] userLogin сохраняется при создании лайка
- [ ] myStatus вычисляется правильно
- [ ] newestLikes отсортированы по убыванию
- [ ] addedAt в ISO формате (toISOString())
- [ ] userId преобразуется в строку (.toString())
- [ ] newestLikes показывает максимум 3 лайка
- [ ] Тесты проходят с Bearer токеном
- [ ] Тесты работают при запросе без токена (myStatus = 'None')

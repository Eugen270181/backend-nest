# Сравнение: Ваш тест лайков на комментарии vs Тесты лайков на посты

## 📊 Структурное сравнение

| Аспект | Comments Likes | Posts Likes |
|--------|--------------|-----------|
| **Создание пользователей** | ✅ createUser() | ✅ createUser() - ОДИНАКОВО |
| **Создание блога** | ✅ Нужен блог | ✅ Нужен блог - ОДИНАКОВО |
| **Создание контента** | ✅ Create post → Create comments | ✅ Create post → Apply likes |
| **Установка лайков** | ✅ PUT `/comments/:commentId/like-status` | ✅ PUT `/posts/:postId/like-status` |
| **Получение с токеном** | ✅ ОБЯЗАТЕЛЬНО `Authorization: Bearer` | ✅ ОБЯЗАТЕЛЬНО `Authorization: Bearer` |
| **Проверка myStatus** | ✅ Проверяет текущего пользователя | ✅ Проверяет текущего пользователя |
| **Проверка newestLikes** | ✅ Отсортирована по убыванию | ✅ Отсортирована по убыванию |

## 🔑 КЛЮЧЕВОЕ ОТЛИЧИЕ - КОТОРОЕ НУЖНО ИСПРАВИТЬ

### ❌ Ошибка в курсовом тесте (получение постов БЕЗ токена):
```typescript
// НЕПРАВИЛЬНО - так НЕ РАБОТАЕТ
const postsResponse = await request(app.getHttpServer())
  .get('/posts')  // ← БЕЗ токена!
  .expect(200);
```

**Результат:** myStatus = "None", newestLikes = []

### ✅ Правильно (получение постов С токеном):
```typescript
// ПРАВИЛЬНО - так НУЖНО
const postsResponse = await request(app.getHttpServer())
  .get('/posts')
  .set('Authorization', `Bearer ${token}`)  // ← С ТОКЕНОМ!
  .expect(200);
```

**Результат:** myStatus = "Like"/"Dislike"/"None", newestLikes = [...]

## 🧪 Полная структура тестового сценария

```
beforeAll
  ├─ Инициализировать приложение
  └─ Подключиться к БД

describe('Setup')
  ├─ createUser(0) → сохранить token[0]
  ├─ createUser(1) → сохранить token[1]
  ├─ createUser(2) → сохранить token[2]
  └─ createUser(3) → сохранить token[3]

describe('Blog & Posts Creation')
  ├─ createBlog() → сохранить blogId
  ├─ createPost(blogId) → сохранить post[0]
  ├─ createPost(blogId) → сохранить post[1]
  ├─ createPost(blogId) → сохранить post[2]
  ├─ createPost(blogId) → сохранить post[3]
  ├─ createPost(blogId) → сохранить post[4]
  └─ createPost(blogId) → сохранить post[5]

describe('Apply Likes/Dislikes')
  ├─ likePost(post[0], user[0]) ✓
  ├─ likePost(post[0], user[1]) ✓
  ├─ likePost(post[1], user[1]) ✓
  ├─ likePost(post[1], user[2]) ✓
  ├─ dislikePost(post[2], user[0]) ✓
  ├─ likePost(post[3], user[0]) ✓
  ├─ likePost(post[3], user[3]) ✓
  ├─ likePost(post[3], user[1]) ✓
  ├─ likePost(post[3], user[2]) ✓
  ├─ likePost(post[4], user[1]) ✓
  ├─ dislikePost(post[4], user[2]) ✓
  ├─ likePost(post[5], user[0]) ✓
  └─ dislikePost(post[5], user[1]) ✓

describe('GET /posts (с токеном user[0])')
  ├─ getPosts(user[0]) → получить с Authorization: Bearer token[0]
  ├─ Проверить post[0]: myStatus="Like", likesCount=2, newestLikes.length>=1
  ├─ Проверить post[1]: myStatus="None", likesCount=2
  ├─ Проверить post[2]: myStatus="Dislike", dislikesCount=1
  ├─ Проверить post[3]: myStatus="Like", likesCount=4, newestLikes.length>=3
  ├─ Проверить post[4]: myStatus="None", likesCount=1, dislikesCount=1
  ├─ Проверить post[5]: myStatus="Like", likesCount=1, dislikesCount=1
  └─ Проверить сортировку newestLikes по addedAt (DESC)

describe('GET /blogs/:blogId/posts (с токеном user[0])')
  ├─ getBlogPosts(user[0], blogId) → с Authorization: Bearer token[0]
  └─ Такие же проверки что и выше

describe('Perspective of Different Users')
  ├─ getPosts(user[1]) → myStatus отличается!
  │   ├─ post[0]: myStatus="Like" (user[1] лайкал)
  │   └─ post[5]: myStatus="Dislike" (user[1] дизлайкал)
  └─ getPosts(user[2]) → myStatus отличается!
      └─ post[1]: myStatus="Like" (user[2] лайкал)

afterAll
  └─ Закрыть соединение с приложением
```

## 🎯 Что проверяет каждый тест

### Test 1: GET -> "/posts"
```
Сценарий:
- 4 пользователя
- 1 блог, 6 постов
- Применены лайки/дизлайки по плану
- Запрос постов от пользователя 1 с его токеном

Проверяет:
✓ myStatus для каждого поста (Like/Dislike/None)
✓ likesCount и dislikesCount
✓ newestLikes не пусты (если есть лайки)
✓ Формат ответа: { pagesCount, page, pageSize, totalCount, items }
✓ Сортировка постов по createdAt (DESC)
✓ Сортировка newestLikes по addedAt (DESC)
```

### Test 2: GET -> "/blogs/:blogId/posts"
```
Сценарий:
- Тот же что выше, но через эндпоинт блога

Проверяет:
✓ Все тоже что Test 1
✓ Эндпоинт блога возвращает те же данные
✓ BlogName и BlogId прилагаются
```

### Test 3: Perspective of Different Users
```
Сценарий:
- Получить посты от user[2]

Проверяет:
✓ myStatus меняется в зависимости от user
✓ user[1]: post[0].myStatus = "Like" (потому что user[1] лайкал)
✓ user[1]: post[5].myStatus = "Dislike" (потому что user[1] дизлайкал)
✓ user[2]: post[1].myStatus = "Like" (потому что user[2] лайкал)
```

## 📝 Миграция с тестов комментариев

Если у вас есть working тесты для комментариев, просто:

1. **Замените endpoints:**
   ```
   /comments/:commentId/like-status → /posts/:postId/like-status
   ```

2. **Замените GET endpoint:**
   ```
   GET /comments?postId=... → GET /posts
   GET /blogs/:blogId/posts/:postId/comments → GET /blogs/:blogId/posts
   ```

3. **Убедитесь в Bearer токене:**
   ```typescript
   .set('Authorization', `Bearer ${token}`) // ← ДОБАВИТЬ!
   ```

4. **Проверьте структуру ответа:**
   ```typescript
   // Для постов
   {
     id, title, shortDescription, content, blogId, blogName, createdAt,
     extendedLikesInfo: {
       likesCount, dislikesCount, myStatus, newestLikes
     }
   }
   ```

## ✅ Чек-лист перед отправкой

- [ ] Все пользователи создаются и получают токены
- [ ] Блог создаётся с корректными данными
- [ ] Все 6 постов создаются в блоге
- [ ] Лайки/дизлайки применяются через PUT endpoint
- [ ] **GET запросы содержат `Authorization: Bearer ${token}`**
- [ ] myStatus проверяется для каждого поста
- [ ] newestLikes сортированы по убыванию addedAt
- [ ] Проверяются разные перспективы пользователей
- [ ] Все коды статуса правильные (201, 204, 200)
- [ ] Тесты проходят на чистой БД

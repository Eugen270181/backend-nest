import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Post, PostDocument } from '../domain/post.entity';
import { CoreConfig } from '../../../../core/core.config';

@Injectable()
export class PostsRepository {
  constructor(
    private coreConfig: CoreConfig,
    private readonly dataSource: DataSource,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('PostsRepository created');
  }

  //строка таблицы (snake_case) -> доменная сущность (camelCase)
  private mapToPost(row: any): Post {
    const post = new Post();

    post.id = row.id;
    post.blogId = row.blog_id;
    post.title = row.title;
    post.shortDescription = row.short_description;
    post.content = row.content;
    post.createdAt = row.created_at;
    post.updatedAt = row.updated_at;
    post.deletedAt = row.deleted_at;

    return post;
  }

  async findById(id: string): Promise<PostDocument | null> {
    try {
      //INNER JOIN с неудалённым блогом: посты мягко удалённого блога считаем несуществующими
      const rows = await this.dataSource.query(
        `SELECT p.*
         FROM posts p
         JOIN blogs b ON b.id = p.blog_id AND b.deleted_at IS NULL
         WHERE p.id = $1 AND p.deleted_at IS NULL
         LIMIT 1`,
        [id],
      );
      return rows.length ? this.mapToPost(rows[0]) : null;
    } catch (e) {
      //22P02 = invalid_text_representation (невалидный uuid) - аналог CastError в Mongo
      if ((e as { code?: string })?.code === '22P02') return null;
      throw e; //обрыв коннекта и пр. → 500
    }
  }

  async save(post: PostDocument): Promise<void> {
    if (!post.id) {
      //новый пост -> INSERT; id/created_at/updated_at приходят из базы через RETURNING
      const rows = await this.dataSource.query(
        `INSERT INTO posts (blog_id, title, short_description, content)
         VALUES ($1, $2, $3, $4)
         RETURNING id, created_at, updated_at`,
        [post.blogId, post.title, post.shortDescription, post.content],
      );
      post.id = rows[0].id;
      post.createdAt = rows[0].created_at;
      post.updatedAt = rows[0].updated_at;
    } else {
      //существующий -> UPDATE (в т.ч. мягкое удаление через deleted_at)
      await this.dataSource.query(
        `UPDATE posts SET
           title = $2, short_description = $3, content = $4,
           deleted_at = $5, updated_at = now()
         WHERE id = $1`,
        [
          post.id,
          post.title,
          post.shortDescription,
          post.content,
          post.deletedAt,
        ],
      );
    }
  }
}

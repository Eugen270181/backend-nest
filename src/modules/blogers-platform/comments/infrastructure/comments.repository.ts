import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Comment, CommentDocument } from '../domain/comment.entity';
import { CoreConfig } from '../../../../core/core.config';

@Injectable()
export class CommentsRepository {
  constructor(
    private coreConfig: CoreConfig,
    private readonly dataSource: DataSource,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('CommentsRepository created');
  }

  //строка таблицы (snake_case) -> доменная сущность (camelCase)
  private mapToComment(row: any): Comment {
    const comment = new Comment();

    comment.id = row.id;
    comment.postId = row.post_id;
    comment.userId = row.user_id;
    comment.content = row.content;
    comment.createdAt = row.created_at;
    comment.updatedAt = row.updated_at;
    comment.deletedAt = row.deleted_at;

    return comment;
  }

  async findById(id: string): Promise<CommentDocument | null> {
    try {
      const rows = await this.dataSource.query(
        `SELECT * FROM comments WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
        [id],
      );
      return rows.length ? this.mapToComment(rows[0]) : null;
    } catch (e) {
      //22P02 = invalid_text_representation (невалидный uuid) - аналог CastError в Mongo
      if ((e as { code?: string })?.code === '22P02') return null;
      throw e; //обрыв коннекта и пр. → 500
    }
  }

  async save(comment: CommentDocument): Promise<void> {
    if (!comment.id) {
      //новый комментарий -> INSERT; id/created_at/updated_at приходят из базы через RETURNING
      const rows = await this.dataSource.query(
        `INSERT INTO comments (post_id, user_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, created_at, updated_at`,
        [comment.postId, comment.userId, comment.content],
      );
      comment.id = rows[0].id;
      comment.createdAt = rows[0].created_at;
      comment.updatedAt = rows[0].updated_at;
    } else {
      //существующий -> UPDATE (в т.ч. мягкое удаление через deleted_at)
      await this.dataSource.query(
        `UPDATE comments SET content = $2, deleted_at = $3, updated_at = now()
         WHERE id = $1`,
        [comment.id, comment.content, comment.deletedAt],
      );
    }
  }
}

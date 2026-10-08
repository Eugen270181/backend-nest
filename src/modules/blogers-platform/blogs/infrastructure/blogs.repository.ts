import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Blog, BlogDocument } from '../domain/blog.entity';
import { CoreConfig } from '../../../../core/core.config';

@Injectable()
export class BlogsRepository {
  constructor(
    private coreConfig: CoreConfig,
    private readonly dataSource: DataSource,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('BlogsRepository created');
  }

  //строка таблицы (snake_case) -> доменная сущность (camelCase)
  private mapToBlog(row: any): Blog {
    const blog = new Blog();

    blog.id = row.id;
    blog.name = row.name;
    blog.description = row.description;
    blog.websiteUrl = row.website_url;
    blog.isMembership = row.is_membership;
    blog.createdAt = row.created_at;
    blog.updatedAt = row.updated_at;
    blog.deletedAt = row.deleted_at;

    return blog;
  }

  async findById(id: string): Promise<BlogDocument | null> {
    try {
      const rows = await this.dataSource.query(
        'SELECT * FROM blogs WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
        [id],
      );
      return rows.length ? this.mapToBlog(rows[0]) : null;
    } catch (e) {
      //22P02 = invalid_text_representation (невалидный uuid) - аналог CastError в Mongo
      if ((e as { code?: string })?.code === '22P02') return null;
      throw e; //обрыв коннекта и пр. → 500
    }
  }

  async save(blog: BlogDocument): Promise<void> {
    if (!blog.id) {
      //новый блог -> INSERT, база сама генерирует id/created_at/updated_at,
      //RETURNING пишет их обратно в объект (аналог того, что Mongo клал _id при save)
      const rows = await this.dataSource.query(
        `INSERT INTO blogs (name, description, website_url, is_membership)
         VALUES ($1, $2, $3, $4)
         RETURNING id, created_at, updated_at`,
        [blog.name, blog.description, blog.websiteUrl, blog.isMembership],
      );
      blog.id = rows[0].id;
      blog.createdAt = rows[0].created_at;
      blog.updatedAt = rows[0].updated_at;
    } else {
      //существующий -> UPDATE (в т.ч. мягкое удаление через deleted_at);
      //updated_at обновляем вручную (плагина timestamps больше нет)
      await this.dataSource.query(
        `UPDATE blogs SET
           name = $2, description = $3, website_url = $4, is_membership = $5,
           deleted_at = $6, updated_at = now()
         WHERE id = $1`,
        [
          blog.id,
          blog.name,
          blog.description,
          blog.websiteUrl,
          blog.isMembership,
          blog.deletedAt,
        ],
      );
    }
  }
}

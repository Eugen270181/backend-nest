import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CoreConfig } from '../../../../core/core.config';
import { LikeStatus } from '../../../../core/dto/enum/like-status.enum';

@Injectable()
export class LikesPostsRepository {
  constructor(
    private coreConfig: CoreConfig,
    private readonly dataSource: DataSource,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('LikesPostsRepository created');
  }

  //Выставляет реакцию пользователя на пост.
  //None -> строка удаляется; Like/Dislike -> UPSERT по PK (post_id, user_id).
  //WHERE в DO UPDATE: если статус не изменился, строка не трогается (updated_at сохраняется).
  async setStatus(
    postId: string,
    userId: string,
    status: LikeStatus,
  ): Promise<void> {
    if (status === LikeStatus.None) {
      await this.dataSource.query(
        `DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`,
        [postId, userId],
      );
      return;
    }
    await this.dataSource.query(
      `INSERT INTO post_likes (post_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (post_id, user_id)
       DO UPDATE SET status = EXCLUDED.status, updated_at = now()
       WHERE post_likes.status <> EXCLUDED.status`,
      [postId, userId, status],
    );
  }
}

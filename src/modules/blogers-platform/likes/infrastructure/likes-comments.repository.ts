import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CoreConfig } from '../../../../core/core.config';
import { LikeStatus } from '../../../../core/dto/enum/like-status.enum';

@Injectable()
export class LikesCommentsRepository {
  constructor(
    private coreConfig: CoreConfig,
    private readonly dataSource: DataSource,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('LikesCommentsRepository created');
  }

  //Выставляет реакцию пользователя на комментарий.
  //None -> строка удаляется; Like/Dislike -> UPSERT по PK (comment_id, user_id).
  //WHERE в DO UPDATE: если статус не изменился, строка не трогается (updated_at сохраняется).
  async setStatus(
    commentId: string,
    userId: string,
    status: LikeStatus,
  ): Promise<void> {
    if (status === LikeStatus.None) {
      await this.dataSource.query(
        `DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2`,
        [commentId, userId],
      );
      return;
    }
    await this.dataSource.query(
      `INSERT INTO comment_likes (comment_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (comment_id, user_id)
       DO UPDATE SET status = EXCLUDED.status, updated_at = now()
       WHERE comment_likes.status <> EXCLUDED.status`,
      [commentId, userId, status],
    );
  }
}

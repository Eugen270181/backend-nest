import { Injectable } from '@nestjs/common';
import { CommentsRepository } from '../infrastructure/comments.repository';
import { appConfig } from '../../../../core/settings/config';

@Injectable()
export class CommentsService {
  constructor(private readonly commentsRepository: CommentsRepository) {
    if (appConfig.IOC_LOG) console.log('CommentsService created');
  }
}

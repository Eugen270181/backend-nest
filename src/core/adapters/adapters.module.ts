import { Module } from '@nestjs/common';

import { UserHelperService } from './user-helper.service';

@Module({
  providers: [UserHelperService],
  exports: [UserHelperService],
})
export class AdaptersModule {}

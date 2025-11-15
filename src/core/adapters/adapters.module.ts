import { Module } from '@nestjs/common';
import { DateService } from './date.service';
import { CodeService } from './code.service';

@Module({
  providers: [CodeService, DateService],
  exports: [CodeService, DateService],
})
export class AdaptersModule {}

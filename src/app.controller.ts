import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AppService } from './app.service';

// This public AI endpoint has an explicit request budget to limit API-cost abuse.
@Controller()
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(@Query('prompt') prompt?: string) {
    // Передаем опциональный промпт в сервис
    return this.appService.generateAiContent(prompt);
  }
}

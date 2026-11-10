import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreConfig } from './core/core.config';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: CoreConfig, useValue: { IOC_LOG: false } },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!" without a prompt', async () => {
      await expect(appController.getHello()).resolves.toBe('Hello World!');
    });

    it('rejects oversized prompts before calling the AI provider', async () => {
      await expect(appController.getHello('a'.repeat(4001))).rejects.toThrow(
        'Prompt must be a string of at most 4000 characters.',
      );
    });

    it('rejects AI requests when the provider is disabled', async () => {
      await expect(appController.getHello('hello')).rejects.toThrow(
        'Gemini AI features are disabled.',
      );
    });
  });
});

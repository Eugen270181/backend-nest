// core/core.module.ts
import { Global, Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CoreConfig } from './core.config';
import { GoogleGenAI } from '@google/genai'; // Если нужен глобально

export const GEMINI_AI_CLIENT = 'GEMINI_AI_CLIENT';

const GeminiAiProvider: Provider = {
  provide: GEMINI_AI_CLIENT,
  useFactory: (coreConfig: CoreConfig) => {
    // Если ключа нет (пустая строка ''), возвращаем null, чтобы SDK не падал при инициализации
    if (!coreConfig.geminiApiKey1) {
      return null;
    }
    return new GoogleGenAI({ apiKey: coreConfig.geminiApiKey1 });
  },
  inject: [CoreConfig],
};

@Global()
@Module({
  imports: [
    CqrsModule, // Глобально для всех модулей
  ],
  providers: [GeminiAiProvider, CoreConfig],
  exports: [CoreConfig, CqrsModule, GeminiAiProvider],
})
export class CoreModule {}

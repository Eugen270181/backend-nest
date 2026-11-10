import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CoreConfig } from './core/core.config';
import { GEMINI_AI_CLIENT } from './core/core.module';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly coreConfig: CoreConfig,
    // @Optional() защищает, если провайдер вернул null (например в тестах без env)
    @Optional()
    @Inject(GEMINI_AI_CLIENT)
    private readonly ai: GoogleGenAI | null,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('AppService created');
  }

  async generateAiContent(prompt?: string): Promise<string> {
    // Bound anonymous input size before forwarding data to a paid external API.
    if (
      prompt !== undefined &&
      (typeof prompt !== 'string' || prompt.length > 4000)
    ) {
      throw new BadRequestException(
        'Prompt must be a string of at most 4000 characters.',
      );
    }

    // 1. Если prompt не передан в query-параметрах
    if (!prompt) {
      return 'Hello World!';
    }

    // 2. Если в тестовой среде или конфиге ключ отсутствует
    if (!this.ai) {
      throw new BadRequestException(
        'Gemini AI features are disabled. Please configure GEMINI_API_KEY_1.',
      );
    }

    // 3. Вызов официального SDK
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        // Включаем инструмент живого поиска Google!
        // config: {
        //   tools: [{ googleSearch: {} }],
        // },
      });

      return response.text ?? 'No response text received from Gemini.';
    } catch (error) {
      // Keep provider details on the server; do not echo internal errors to API clients.
      this.logger.error(
        'Gemini API request failed',
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException(
        'AI service is temporarily unavailable.',
      );
    }
  }
}

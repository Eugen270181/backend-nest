import {
  BadRequestException,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { CoreConfig } from './core/core.config';
import { GEMINI_AI_CLIENT } from './core/core.module';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AppService {
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
    // 1. Если prompt не передан в query-параметрах
    if (!prompt) {
      return 'Hello World!';
    }

    // 2. Если в тестовой среде или конфиге ключ отсутствует
    if (!this.ai) {
      throw new BadRequestException(
        'Gemini AI features are disabled. Please configure GEMINI_API_KEY1 variable.',
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
      console.error('Gemini API Error:', error);
      throw new BadRequestException(
        `Failed to generate content from AI: ${error.message}`,
      );
    }
  }
}

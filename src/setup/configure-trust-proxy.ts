import { INestApplication, Logger } from '@nestjs/common';

export function configureTrustProxy(app: INestApplication) {
  // Получаем httpAdapter через метод .getHttpAdapter() объекта app
  const httpAdapter = app.getHttpAdapter();

  // Приводим к record, чтобы TypeScript не ругался на динамические свойства
  const instance = httpAdapter.getInstance() as Record<string, any>;

  // Проверяем тип движка динамически по наличию методов
  if (instance && typeof instance.set === 'function') {
    // 1. Если под капотом Express
    instance.set('trust proxy', true);
    Logger.log('Proxy trust enabled for Express engine', 'ProxyConfig');
  } else if (
    instance &&
    instance.constructor &&
    instance.constructor.name === 'FastifyInstance'
  ) {
    // 2. Если под капотом Fastify
    if (instance.config) {
      instance.config.trustProxy = true;
    }
    Logger.log('Proxy trust enabled for Fastify engine', 'ProxyConfig');
  } else {
    // На случай использования любого другого кастомного адаптера
    Logger.warn(
      'Unknown HTTP engine. Failed to automatically set trust proxy.',
      'ProxyConfig',
    );
  }
}

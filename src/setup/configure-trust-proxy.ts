import { INestApplication, Logger } from '@nestjs/common';

export function configureTrustProxy(
  app: INestApplication,
  trustProxyHops = 0,
) {
  // Получаем httpAdapter через метод .getHttpAdapter() объекта app
  const httpAdapter = app.getHttpAdapter();

  // Приводим к record, чтобы TypeScript не ругался на динамические свойства
  const instance = httpAdapter.getInstance() as Record<string, any>;

  // Проверяем тип движка динамически по наличию методов
  if (instance && typeof instance.set === 'function') {
    // 1. Если под капотом Express
    // Trust only the number of proxy hops explicitly configured by the operator.
    instance.set('trust proxy', trustProxyHops);
    Logger.log(
      `Express trust proxy hops: ${trustProxyHops}`,
      'ProxyConfig',
    );
  } else if (
    instance &&
    instance.constructor &&
    instance.constructor.name === 'FastifyInstance'
  ) {
    // 2. Если под капотом Fastify
    if (instance.config) {
      instance.config.trustProxy = trustProxyHops;
    }
    Logger.log(
      `Fastify trust proxy setting: ${trustProxyHops}`,
      'ProxyConfig',
    );
  } else {
    // На случай использования любого другого кастомного адаптера
    Logger.warn(
      'Unknown HTTP engine. Failed to automatically set trust proxy.',
      'ProxyConfig',
    );
  }
}

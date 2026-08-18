import { NestFactory } from '@nestjs/core';
import { appSetup } from './setup/app.setup';
import { initAppModule } from './init-app-module';
import { CoreConfig } from './core/core.config';
import ngrok from '@ngrok/ngrok';

async function bootstrap() {
  //создаем динамический модуль, чтобы еще до старта, знать переменные окружения
  const DynamicAppModule = initAppModule();
  // создаём на основе донастроенного модуля наше приложение
  const app = await NestFactory.create(DynamicAppModule);

  const coreConfig = app.get<CoreConfig>(CoreConfig);

  appSetup(app, coreConfig.isSwaggerEnabled); //глобальные настройки приложения

  const port = coreConfig.port;
  const ngrokAuthToken = coreConfig.ngrokAuthTokenSecret;

  await app.listen(port, () => {
    console.log('App starting listen port: ', port);
    console.log('NODE_ENV: ', coreConfig.node_env);
    console.log('includeTestingModule: ', coreConfig.includeTestingModule);
  });

  // Запускаем туннель только если это не production-среда
  if (process.env.NODE_ENV !== 'production') {
    try {
      const session = await new ngrok.SessionBuilder()
        .authtoken(ngrokAuthToken) // Токен из шага 2
        .connect();

      // Используем listenAndForward, чтобы сразу связать внешний адрес с локальным портом
      const listener = await session
        .httpEndpoint()
        .listenAndForward(`http://localhost:${port}`);

      console.log('\n==================================================');
      console.log(`🚀 Ссылка для автотестов курса: ${listener.url()}`);
      console.log('==================================================\n');
    } catch (error) {
      console.error('❌ Не удалось запустить ngrok туннель:', error);
    }
  }
}
bootstrap();

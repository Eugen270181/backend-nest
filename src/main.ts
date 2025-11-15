import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app: NestExpressApplication =
    await NestFactory.create<NestExpressApplication>(AppModule);

  appSetup(app); //глобальные настройки приложения

  const PORT = process.env.PORT || 3000; //TODO: move to configService. will be in the following lessons

  await app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
  });
}
bootstrap();

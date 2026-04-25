import { pipesSetup } from './pipes.setup';
import { swaggerSetup } from './swagger.setup';
import { globalPrefixSetup } from './global-prefix.setup';
import cookieParser from 'cookie-parser';
import { INestApplication } from '@nestjs/common';

export function appSetup(app: INestApplication, isSwaggerEnabled: boolean) {
  //app.set('trust proxy', true); //доверять прокси-серверам при определении IP-адреса клиента и другой информации из заголовков запроса
  //app.set('trust proxy', 'loopback'); // Trust requests from the loopback address
  const httpAdapter = app.getHttpAdapter();
  const expressInstance = httpAdapter.getInstance(); // это express-приложение
  expressInstance.set('trust proxy', true);

  app.use(cookieParser()); // If we need parse cookie in req

  pipesSetup(app);
  globalPrefixSetup(app);
  swaggerSetup(app, isSwaggerEnabled);
}

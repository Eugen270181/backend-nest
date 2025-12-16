import { pipesSetup } from './pipes.setup';
import { swaggerSetup } from './swagger.setup';
import { globalPrefixSetup } from './global-prefix.setup';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

export function appSetup(app: NestExpressApplication) {
  //app.set('trust proxy', true); //доверять прокси-серверам при определении IP-адреса клиента и другой информации из заголовков запроса
  app.set('trust proxy', 'loopback'); // Trust requests from the loopback address
  app.use(cookieParser()); // If we need parse cookie in req

  pipesSetup(app);
  globalPrefixSetup(app);
  swaggerSetup(app);
}

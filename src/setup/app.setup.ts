import { pipesSetup } from './pipes.setup';
import { INestApplication } from '@nestjs/common';
//import { globalPrefixSetup } from './global-prefix.setup';
import { swaggerSetup } from './swagger.setup';
import { globalPrefixSetup } from './global-prefix.setup';
import { NestExpressApplication } from '@nestjs/platform-express';

export function appSetup(app: NestExpressApplication) {
  //app.set('trust proxy', true); //доверять прокси-серверам при определении IP-адреса клиента и другой информации из заголовков запроса
  app.set('trust proxy', 'loopback'); // Trust requests from the loopback address
  pipesSetup(app);
  globalPrefixSetup(app);
  swaggerSetup(app);
}

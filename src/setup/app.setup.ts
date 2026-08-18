import { pipesSetup } from './pipes.setup';
import { swaggerSetup } from './swagger.setup';
import { globalPrefixSetup } from './global-prefix.setup';
import cookieParser from 'cookie-parser';
import { INestApplication } from '@nestjs/common';
import { configureTrustProxy } from './configure-trust-proxy';

export function appSetup(app: INestApplication, isSwaggerEnabled: boolean) {
  configureTrustProxy(app);

  app.use(cookieParser());

  pipesSetup(app);
  globalPrefixSetup(app);
  swaggerSetup(app, isSwaggerEnabled);
}

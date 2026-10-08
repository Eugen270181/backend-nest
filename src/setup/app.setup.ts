import { pipesSetup } from './pipes.setup';
import { swaggerSetup } from './swagger.setup';
import { globalPrefixSetup } from './global-prefix.setup';
import cookieParser from 'cookie-parser';
import { INestApplication } from '@nestjs/common';
import { configureTrustProxy } from './configure-trust-proxy';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

export function appSetup(app: INestApplication, isSwaggerEnabled: boolean) {
  (app as NestExpressApplication).useStaticAssets(
    join(process.cwd(), 'public'),
  );

  configureTrustProxy(app);

  app.use(cookieParser());

  pipesSetup(app);
  globalPrefixSetup(app);
  swaggerSetup(app, isSwaggerEnabled);
}

import { INestApplication } from '@nestjs/common';
import { routerPaths } from '../core/settings/paths';

export const GLOBAL_PREFIX: string = 'api';

export function globalPrefixSetup(app: INestApplication) {
  //специальный метод, который добавляет ко всем маршрутам /GLOBAL_PREFIX
  app.setGlobalPrefix(GLOBAL_PREFIX, {
    exclude: [routerPaths.docs], // исключаем Swagger из префикса
  });
}

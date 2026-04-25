import { DynamicModule } from '@nestjs/common';
import { AppModule } from './app.module';
import { configValidationUtility } from './setup/config-validation.utility';

// export async function initAppModule(): Promise<DynamicModule> {
//   // из-за того, что нам нужно донастроить динамический AppModule, мы не можем сразу создавать приложение,
//   // а создаём сначала контекст
//   const appContext = await NestFactory.createApplicationContext(AppModule);
//   const coreConfig = appContext.get<CoreConfig>(CoreConfig);
//   await appContext.close();
//
//   return AppModule.forRoot(coreConfig);
// }
export function initAppModule(): DynamicModule {
  const includeTestingModule =
    configValidationUtility.convertToBoolean(
      process.env.INCLUDE_TESTING_MODULE as string,
    ) ?? false;
  return AppModule.forRoot(includeTestingModule);
}

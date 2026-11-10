import { DynamicModule } from '@nestjs/common';
import { AppModule } from './app.module';
import { configValidationUtility } from './config-validation.utility';

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
  // Normalise the legacy `.env.testing` value used by one of the test runners.
  const nodeEnv = (process.env.NODE_ENV || '')
    .replace(/^\.env\./i, '')
    .toLowerCase();
  const testingFlag = process.env.INCLUDE_TESTING_MODULE;
  // When running the dedicated test environment, default to enabled because dotenv
  // is loaded by Nest after this module factory is evaluated. An explicit false wins.
  const testingWasRequested =
    testingFlag === undefined ||
    configValidationUtility.convertToBoolean(testingFlag) === true;

  // Never expose the destructive test controller in development, staging or production.
  const includeTestingModule = nodeEnv === 'testing' && testingWasRequested;
  return AppModule.forRoot(includeTestingModule);
}

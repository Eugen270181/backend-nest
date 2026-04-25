import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { initTestAppModule } from './init-test-app-module';
import { appSetup } from '../src/setup/app.setup';

type Override = {
  token: any;
  useValue?: any;
  useClass?: any;
  useFactory?: any;
};

export async function initTestApp(
  enableSwagger = false,
): Promise<INestApplication> {
  const dynamicAppModule = await initTestAppModule();
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [dynamicAppModule],
  }).compile();
  const app = moduleFixture.createNestApplication();
  appSetup(app, enableSwagger);
  await app.init();
  return app;
}

export async function initTestAppWithOverrides(
  enableSwagger = false,
  overrides: Override[] = [],
): Promise<{ app: INestApplication; moduleFixture: TestingModule }> {
  const dynamicAppModule = await initTestAppModule();
  let builder = Test.createTestingModule({
    imports: [dynamicAppModule],
  });

  for (const override of overrides) {
    if (override.useValue) {
      builder = builder
        .overrideProvider(override.token)
        .useValue(override.useValue);
    } else if (override.useClass) {
      builder = builder
        .overrideProvider(override.token)
        .useClass(override.useClass);
    } else if (override.useFactory) {
      builder = builder
        .overrideProvider(override.token)
        .useFactory(override.useFactory);
    }
  }

  const moduleFixture = await builder.compile();
  const app = moduleFixture.createNestApplication();
  appSetup(app, enableSwagger);
  await app.init();
  return { app, moduleFixture };
}

import { Global, Module } from '@nestjs/common';

//глобальный модуль для провайдеров и модулей необходимых во всех частях приложения (например LoggerService, CqrsModule, etc...)
@Global()
@Module({
  // exports: [GlobalLogerService],
  //providers: [HashService],
  //exports: [HashService],
})
export class CoreModule {}

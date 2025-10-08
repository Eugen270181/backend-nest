import { Global, Module } from '@nestjs/common';

//глобальный модуль для провайдеров и модулей необходимых во всех частях приложения (например LoggerService, CqrsModule, etc...)
@Global()
@Module({
  // exports: [GlobalLogerService],
  //providers: [CryptoService],
  //exports: [CryptoService],
})
export class CoreModule {}

import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Global() // ✅ Global — доступен везде!
@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    }),
  ],
  providers: [
    {
      provide: 'WinstonLogger', // ✅ Token!
      useFactory: (logger: any) => logger,
      inject: [WinstonModule],
    },
  ],
  exports: [WinstonModule, 'WinstonLogger'], // ✅ Экспорт!
})
export class LoggerModule {}

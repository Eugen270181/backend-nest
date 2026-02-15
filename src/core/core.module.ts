// core/core.module.ts
import { Global, Logger, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { CqrsModule } from '@nestjs/cqrs'; // Если нужен глобально

@Global()
@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    }),
    CqrsModule, // Глобально для всех модулей
  ],
  providers: [
    {
      provide: Logger, // ✅ Nest Logger!
      useValue: WinstonModule, // Подменяем на Winston
    },
  ],
  exports: [WinstonModule, Logger],
})
export class CoreModule {}

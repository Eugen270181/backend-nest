// core/core.module.ts
import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CoreConfig } from './core.config'; // Если нужен глобально

@Global()
@Module({
  imports: [
    // WinstonModule.forRoot({
    //   transports: [
    //     new winston.transports.Console({
    //       format: winston.format.combine(
    //         winston.format.timestamp(),
    //         winston.format.errors({ stack: true }),
    //         winston.format.json(),
    //       ),
    //     }),
    //     new winston.transports.File({
    //       filename: 'logs/error.log',
    //       level: 'error',
    //     }),
    //     new winston.transports.File({ filename: 'logs/combined.log' }),
    //   ],
    // }),
    CqrsModule, // Глобально для всех модулей
  ],
  providers: [
    // {
    //   provide: Logger, // ✅ Nest Logger!
    //   useValue: WinstonModule, // Подменяем на Winston
    // },
    CoreConfig,
  ],
  exports: [CoreConfig, CqrsModule],
})
export class CoreModule {}

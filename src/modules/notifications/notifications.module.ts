import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { SendConfirmationEmailWhenUserRegisteredEventHandler } from './application/event-handlers/send-confirmation-email-when-user-registered.event-handler';
import { SendSmsWhenUserRegisteredEventHandler } from './application/event-handlers/send-sms-when-user-registered.event-handler';
import { CqrsModule } from '@nestjs/cqrs';
import { EmailFactoryService } from './application/email/email-factory.service';
import { NotificationsConfig } from './notifications.config';

@Global()
@Module({
  imports: [
    CqrsModule,
    MailerModule.forRootAsync({
      useFactory: (notificationsConfig: NotificationsConfig) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: notificationsConfig.email, // или coreConfig.EMAIL, в зависимости от названия поля
            pass: notificationsConfig.emailPass, // или coreConfig.EMAIL_PASS
          },
        },
        defaults: {
          from: '"nest-modules" <modules@nestjs.com>',
        },
      }),
      inject: [NotificationsConfig],
    }),
  ],
  providers: [
    NotificationsConfig,
    EmailService,
    EmailFactoryService,
    SendConfirmationEmailWhenUserRegisteredEventHandler,
    SendSmsWhenUserRegisteredEventHandler,
  ],
  exports: [NotificationsConfig],
})
export class NotificationsModule {}

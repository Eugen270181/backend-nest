import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { appConfig } from '../../core/settings/config';
import { SendConfirmationEmailWhenUserRegisteredEventHandler } from './application/event-handlers/send-confirmation-email-when-user-registered.event-handler';
import { SendSmsWhenUserRegisteredEventHandler } from './application/event-handlers/send-sms-when-user-registered.event-handler';
import { CqrsModule } from '@nestjs/cqrs';
import { EmailFactoryService } from './application/email/email-factory.service';

@Module({
  imports: [
    CqrsModule,
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // для 465 порта нужно true
        auth: {
          user: appConfig.EMAIL, // ваш email
          pass: appConfig.EMAIL_PASS, // пароль приложения (не обычный пароль Gmail)
        },
      },
      defaults: {
        from: '"nest-modules" <modules@nestjs.com>',
      },
    }),
  ],
  providers: [
    EmailService,
    EmailFactoryService,
    SendConfirmationEmailWhenUserRegisteredEventHandler,
    SendSmsWhenUserRegisteredEventHandler,
  ],
  exports: [],
})
export class NotificationsModule {}

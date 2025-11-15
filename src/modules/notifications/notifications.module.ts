import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { appConfig } from '../../core/settings/config';

@Module({
  imports: [
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
  providers: [EmailService],
  exports: [EmailService],
})
export class NotificationsModule {}

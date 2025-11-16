import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendConfirmationEmail(email: string, code: string): Promise<void> {
    //can add html templates, implement advertising and other logic for mailing...
    await this.mailerService.sendMail({
      to: email,
      html: `<a href=https://some.site/api/auth/registation-confirmation?code=${code}>confirmation email</a>`,
    });
  }
}

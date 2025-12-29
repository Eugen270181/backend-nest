import { EmailType } from '../../../../core/dto/enum/email-type.enum';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailFactoryService {
  createEmailTemplate(type: EmailType, email: string, code: string) {
    switch (type) {
      case EmailType.registration:
        return `<a href=https://some.site/api/auth/registration?code=${code}>registration link</a>`;
      case EmailType.password_recovery:
        return `<a href=https://some.site/api/auth/password-recovery?code=${code}>recovery password link</a>`;
      case EmailType.resend:
        return `<a href=https://some.site/api/auth/email-resend?code=${code}>registration email resend link</a>`;
    }
  }
}

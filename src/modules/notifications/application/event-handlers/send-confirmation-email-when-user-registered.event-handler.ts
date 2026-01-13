import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EmailService } from '../../email.service';
import { SendUserEmailCodeEvent } from '../../../user-accounts/domain/events/send-user-email-code.event';
import { EmailFactoryService } from '../email/email-factory.service';
import { appConfig } from '../../../../core/settings/config';

@EventsHandler(SendUserEmailCodeEvent)
export class SendConfirmationEmailWhenUserRegisteredEventHandler
  implements IEventHandler<SendUserEmailCodeEvent>
{
  constructor(
    private emailService: EmailService,
    private emailFactory: EmailFactoryService,
  ) {
    if (appConfig.IOC_LOG)
      console.log(
        'SendConfirmationEmailWhenUserRegisteredEventHandler created',
      );
  }

  async handle(event: SendUserEmailCodeEvent) {
    // Ошибки в EventHandlers не могут быть пойманы фильтрами исключений:
    // необходимо обрабатывать вручную
    try {
      console.log('send email');
      const template = this.emailFactory.createEmailTemplate(
        event.type,
        event.email,
        event.confirmationCode,
      );
      await this.emailService.sendConfirmationEmail(event.email, template);
    } catch (e) {
      console.error('send email', e);
    }
  }
}

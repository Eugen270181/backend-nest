import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EmailService } from '../../email.service';
import { SendUserEmailCodeEvent } from '../../../user-accounts/domain/events/send-user-email-code.event';
import { appConfig } from '../../../../core/settings/config';

@EventsHandler(SendUserEmailCodeEvent)
export class SendSmsWhenUserRegisteredEventHandler
  implements IEventHandler<SendUserEmailCodeEvent>
{
  constructor(private emailService: EmailService) {
    if (appConfig.IOC_LOG)
      console.log('SendSmsWhenUserRegisteredEventHandler created');
  }

  handle(event: SendUserEmailCodeEvent) {
    // Ошибки в EventHandlers не могут быть пойманы фильтрами исключений:
    // необходимо обрабатывать вручную
    try {
      console.log('send sms with code', event.confirmationCode);
    } catch (e) {
      console.error('send sms', e);
    }
  }
}

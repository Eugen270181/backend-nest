import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EmailService } from '../../email.service';
import { UserRegisteredEvent } from '../../../user-accounts/domain/events/user-registered.event';

@EventsHandler(UserRegisteredEvent)
export class SendSmsWhenUserRegisteredEventHandler
  implements IEventHandler<UserRegisteredEvent>
{
  constructor(private emailService: EmailService) {}

  handle(event: UserRegisteredEvent) {
    // Ошибки в EventHandlers не могут быть пойманы фильтрами исключений:
    // необходимо обрабатывать вручную
    try {
      console.log('send sms with email', event.email);
    } catch (e) {
      console.error('send sms', e);
    }
  }
}

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EmailService } from '../../email.service';
import { UserRegisteredEvent } from '../../../user-registered.event';

@EventsHandler(UserRegisteredEvent)
export class SendConfirmationEmailWhenUserRegisteredEventHandler
  implements IEventHandler<UserRegisteredEvent>
{
  constructor(private emailService: EmailService) {}

  async handle(event: UserRegisteredEvent) {
    // Ошибки в EventHandlers не могут быть пойманы фильтрами исключений:
    // необходимо обрабатывать вручную
    try {
      await this.emailService.sendConfirmationEmail(
        event.email,
        event.confirmationCode,
      );
    } catch (e) {
      console.error('send email', e);
    }
  }
}

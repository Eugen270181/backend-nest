import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EmailService } from '../../email.service';
import { SendUserEmailCodeEvent } from '../../../user-accounts/domain/events/send-user-email-code.event';
import { CoreConfig } from '../../../../core/core.config';

@EventsHandler(SendUserEmailCodeEvent)
export class SendSmsWhenUserRegisteredEventHandler
  implements IEventHandler<SendUserEmailCodeEvent>
{
  constructor(
    private coreConfig: CoreConfig,
    private emailService: EmailService,
  ) {
    if (this.coreConfig.IOC_LOG)
      console.log('SendSmsWhenUserRegisteredEventHandler created');
  }

  handle(_event: SendUserEmailCodeEvent) {
    // SMS transport is not configured in this project.
    // Do not log one-time codes here or in any other event handler.
  }
}

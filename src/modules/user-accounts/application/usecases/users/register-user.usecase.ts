import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../../core/settings/config';
import { CreateUserDto } from '../../dto/user.dto';
import { UserDocument } from '../../../domain/user.entity';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { UsersFactory } from '../../factories/users.factory';

import { SendUserEmailCodeEvent } from '../../../domain/events/send-user-email-code.event';
import { EmailType } from '../../../../../core/dto/enum/email-type.enum';

export class RegisterUserCommand {
  constructor(public readonly dto: CreateUserDto) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase
  implements ICommandHandler<RegisterUserCommand, void>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersFactory: UsersFactory,
    private readonly eventBus: EventBus,
  ) {
    if (appConfig.IOC_LOG) console.log('RegisterUserUseCase created');
  }

  async execute({ dto }: RegisterUserCommand) {
    //создаем пользователя через фабричный метод с установкой объета с кодом активации пользователя по мылу
    const userDocument: UserDocument =
      await this.usersFactory.createUserByReg(dto);

    await this.usersRepository.save(userDocument);

    this.eventBus.publish(
      new SendUserEmailCodeEvent(
        dto.email,
        userDocument.emailConfirmation!.confirmationCode,
        EmailType.registration,
      ),
    );
    //отправляем уведомление о создании пользователя с кодом активации на мыло
    //todo with publish sendmail notification
    // await this.emailService
    //   .sendConfirmationEmail(
    //     userDocument.email,
    //     userDocument.emailConfirmation.confirmationCode,
    //   )
    //   .catch(console.error);
  }
}

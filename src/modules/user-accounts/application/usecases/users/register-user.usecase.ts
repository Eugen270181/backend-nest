import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../../core/settings/config';
import { CreateUserDto } from '../../dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../../../domain/user.entity';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { UsersFactory } from '../../factories/users.factory';

export class RegisterUserCommand {
  constructor(public readonly dto: CreateUserDto) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase
  implements ICommandHandler<RegisterUserCommand, void>
{
  constructor(
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
    private readonly usersRepository: UsersRepository,
    private readonly usersFactory: UsersFactory,
  ) {
    if (appConfig.IOC_LOG) console.log('RegisterUserUseCase created');
  }

  async execute({ dto }: RegisterUserCommand) {
    //создаем пользователя через фабричный метод с установкой объета с кодом активации пользователя по мылу
    const userDocument: UserDocument =
      await this.usersFactory.createUserByReg(dto);
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

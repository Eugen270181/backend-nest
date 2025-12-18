import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { appConfig } from '../../../../core/settings/config';
import { AuthViewDto } from '../../api/view-dto/auth.view-dto';
import { JwtService } from '@nestjs/jwt';

export class LoginUserCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase
  implements ICommandHandler<LoginUserCommand, AuthViewDto>
{
  constructor(private jwtService: JwtService) {
    if (appConfig.IOC_LOG) console.log('LoginUserUseCase created');
  }

  async execute({ id }: LoginUserCommand): Promise<AuthViewDto> {
    const accessToken = await this.jwtService.signAsync({ id });

    return { accessToken };
  }
}

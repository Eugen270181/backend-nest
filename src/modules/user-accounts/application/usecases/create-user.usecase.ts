import { CreateUserInputDto } from '../../api/input-dto/create-users.input-dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../domain/user.entity';
import { UsersRepository } from '../../infrastructure/users.repository';
import { CryptoService } from '../crypto.service';
import { UserValidationService } from '../user-validation.service';
import { UserSearchType } from '../dto/enum/user-search-type';

export class CreateUserCommand {
  constructor(public readonly dto: CreateUserInputDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase
  implements ICommandHandler<CreateUserCommand, string>
{
  constructor(
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
    private readonly usersRepository: UsersRepository,
    private readonly cryptoService: CryptoService,
    private readonly userValidationService: UserValidationService,
  ) {}

  async execute({ dto }: CreateUserCommand): Promise<string> {
    // Проверяем уникальность логина и email
    await this.userValidationService.ensureUserUnique(
      UserSearchType.Login,
      dto.login,
    );
    await this.userValidationService.ensureUserUnique(
      UserSearchType.Email,
      dto.email,
    );

    const passwordHash = await this.cryptoService.getHash(dto.password);

    const userDocument = this.UserModel.createUserBySa({
      email: dto.email,
      login: dto.login,
      passwordHash,
      // остальные поля по твоей схеме
    });

    await this.usersRepository.save(userDocument);

    return userDocument._id.toString();
  }
}

import { EmailConfirmation } from './email-confirmation.schema';
import { PassConfirmation } from './pass-confirmation.schema';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { UserConfirmCodeDto } from '../../../core/dto/type/user-confirm-code.dto';

//Доменная сущность без ORM-декораторов: хранение теперь в Postgres (raw SQL),
//всю работу с таблицей делает UsersRepository
export class User {
  //генерируется базой (gen_random_uuid) — до первого INSERT его ещё нет
  id: string | null = null;

  login: string;
  email: string;
  passwordHash: string;
  isConfirmed: boolean = false;

  emailConfirmation: EmailConfirmation | null = null;
  passConfirmation: PassConfirmation | null = null;

  //заполняются базой (DEFAULT now()), репозиторий пишет их обратно в объект
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null = null;

  static createInstance(dto: CreateUserDomainDto): User {
    const user = new this();

    user.login = dto.login;
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;

    return user;
  }

  updatePassHash(passwordHash: string) {
    this.passwordHash = passwordHash;
  }

  setUserConfirmation() {
    this.isConfirmed = true;
  }

  setRegConfirmationCode(dto: UserConfirmCodeDto) {
    this.emailConfirmation = dto;
  }

  setPassConfirmationCode(dto: UserConfirmCodeDto) {
    this.passConfirmation = dto;
  }
}

//АЛИАС: раньше UserDocument = HydratedDocument<User>, теперь это просто User.
//Благодаря этому use-case'ы и сервисы, импортирующие UserDocument, не меняются.
export type UserDocument = User;

import { CreateUserDto } from '../../dto/user.dto';

export class CreateUserInputDto implements CreateUserDto {
  login: string;
  password: string;
  email: string;
}

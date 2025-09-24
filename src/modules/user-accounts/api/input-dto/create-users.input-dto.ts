import { CreateUserDto } from '../../application/dto/user.dto';
import { IsStringWithTrim } from '../../../../core/decorators/validation/is-string-with-trim';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class CreateUserInputDto implements CreateUserDto {
  @IsStringWithTrim({ maxLength: 10, minLength: 3 })
  @Matches(/^[a-zA-Z0-9_-]*$/)
  login: string;

  @IsString()
  @Length(6, 20)
  password: string;

  @IsEmail()
  email: string;
}

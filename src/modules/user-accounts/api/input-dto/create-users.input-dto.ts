import { CreateUserDto } from '../../application/dto/user.dto';
import { IsStringWithTrim } from '../../../../core/decorators/validation/is-string-with-trim';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateUserInputDto implements CreateUserDto {
  @IsNotEmpty()
  @IsStringWithTrim({ maxLength: 10, minLength: 3 })
  @Matches(/^[a-zA-Z0-9_-]*$/)
  login: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 20)
  password: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}

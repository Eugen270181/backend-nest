import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailInputDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

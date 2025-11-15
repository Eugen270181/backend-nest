import { IsNotEmpty, IsString } from 'class-validator';

export class LoginInputDto {
  @IsNotEmpty()
  @IsString()
  loginOrEmail: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

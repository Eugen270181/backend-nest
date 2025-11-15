import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ConfirmPassInputDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 20)
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  recoveryCode: string;
}

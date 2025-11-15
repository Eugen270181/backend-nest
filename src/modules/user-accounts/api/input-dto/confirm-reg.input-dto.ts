import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmRegInputDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}

import { IsMongoId } from 'class-validator';

export class ParamsObjectIdDto {
  @IsMongoId()
  id: string;
}

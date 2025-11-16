import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import { IsMongoId } from 'class-validator';

export class UpdatePostInputDto {
  @IsStringWithTrim({ maxLength: 30 })
  title: string;

  @IsStringWithTrim({ maxLength: 100 })
  shortDescription: string;

  @IsStringWithTrim({ maxLength: 1000 })
  content: string;

  @IsMongoId()
  blogId: string;
}

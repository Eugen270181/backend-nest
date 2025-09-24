import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';

export class CreateBlogPostInputDto {
  @IsStringWithTrim({ maxLength: 30 })
  title: string;

  @IsStringWithTrim({ maxLength: 100 })
  shortDescription: string;

  @IsStringWithTrim({ maxLength: 1000 })
  content: string;
}

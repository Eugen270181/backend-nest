import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';

export class CreateCommentInputDto {
  @IsStringWithTrim({ minLength: 20, maxLength: 300 })
  content: string;
}

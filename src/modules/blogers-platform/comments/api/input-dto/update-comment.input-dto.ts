import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';

export class UpdateCommentInputDto {
  @IsStringWithTrim({ minLength: 20, maxLength: 300 })
  content: string;
}

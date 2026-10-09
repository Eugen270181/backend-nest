import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';

//blogId в теле больше нет: он берётся из url (PUT /sa/blogs/:blogId/posts/:postId)
export class UpdatePostInputDto {
  @IsStringWithTrim({ maxLength: 30 })
  title: string;

  @IsStringWithTrim({ maxLength: 100 })
  shortDescription: string;

  @IsStringWithTrim({ maxLength: 1000 })
  content: string;
}

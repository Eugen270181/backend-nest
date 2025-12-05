import { CreateBlogDto } from '../../application/dto/blog.dto';
import { Matches } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';

export class CreateBlogInputDto implements CreateBlogDto {
  @IsStringWithTrim({ maxLength: 15 })
  name: string;

  @IsStringWithTrim({ maxLength: 500 })
  description: string;

  @IsStringWithTrim({ maxLength: 100 })
  @Matches(
    /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
  )
  websiteUrl: string;
}

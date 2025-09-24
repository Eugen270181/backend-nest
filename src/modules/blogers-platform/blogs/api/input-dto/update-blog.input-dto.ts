import {
  IsDefined,
  IsNotEmpty,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import { Type } from 'class-transformer';

export class UpdateBlogInputDto {
  @IsStringWithTrim({ maxLength: 15 })
  name: string;

  @IsStringWithTrim({ maxLength: 500 })
  description: string;

  @IsStringWithTrim({ maxLength: 100 })
  @IsUrl()
  websiteUrl: string;
}

class InformationDto {
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

export class TestsBlogInputDto {
  @IsStringWithTrim({ maxLength: 15 })
  name: string;

  @IsStringWithTrim({ maxLength: 500 })
  description: string;

  @IsStringWithTrim({ maxLength: 100 })
  @Matches(
    /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
  )
  websiteUrl: string;

  @IsDefined()
  @ValidateNested() // Валидирует вложенный объект
  @Type(() => InformationDto) // Преобразует в класс (обязательно для NestJS)
  information: InformationDto;
}

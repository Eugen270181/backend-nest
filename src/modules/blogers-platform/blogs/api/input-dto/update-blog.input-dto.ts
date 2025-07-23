import { UpdateBlogDto } from '../../dto/blog.dto';

export class UpdateBlogInputDto implements UpdateBlogDto {
  name: string;
  websiteUrl: string;
  description: string;
}

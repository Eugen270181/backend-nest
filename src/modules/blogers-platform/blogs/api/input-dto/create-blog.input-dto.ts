import { CreateBlogDto } from '../../dto/blog.dto';

export class CreateBlogInputDto implements CreateBlogDto {
  name: string;
  websiteUrl: string;
  description: string;
}

import { UpdateBlogInputDto } from '../../api/input-dto/update-blog.input-dto';

export class CreateBlogDto {
  name: string;
  description: string;
  websiteUrl: string;
}

export class UpdateBlogDto extends UpdateBlogInputDto {
  id: string;
}

import { BlogDocument } from '../../domain/blog.entity';

export class BlogViewDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  isMembership: boolean;
  createdAt: string;

  static mapToView(blog: BlogDocument): BlogViewDto {
    const dto = new BlogViewDto();

    dto.id = blog._id.toString();
    dto.name = blog.name;
    dto.description = blog.description;
    dto.websiteUrl = blog.websiteUrl;
    dto.createdAt = blog.createdAt.toISOString();
    dto.isMembership = blog.isMembership;

    return dto;
  }
}

export class BlogViewDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  isMembership: boolean;
  createdAt: string;

  //маппер принимает строку таблицы blogs (snake_case)
  static mapRowToView(row: any): BlogViewDto {
    const dto = new BlogViewDto();

    dto.id = row.id;
    dto.name = row.name;
    dto.description = row.description;
    dto.websiteUrl = row.website_url;
    dto.createdAt = row.created_at.toISOString();
    dto.isMembership = row.is_membership;

    return dto;
  }
}

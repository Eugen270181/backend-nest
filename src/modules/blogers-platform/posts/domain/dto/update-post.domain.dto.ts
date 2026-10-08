//blogId пост не меняет: он задаётся при создании (POST /sa/blogs/:blogId/posts)
export class UpdatePostDomainDto {
  title: string;
  shortDescription: string;
  content: string;
}

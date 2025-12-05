export class CreatePostDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

export class UpdatePostDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

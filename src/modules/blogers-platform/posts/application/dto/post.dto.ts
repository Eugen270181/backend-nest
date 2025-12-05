export class CreatePostDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

export class UpdatePostDto {
  postId: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

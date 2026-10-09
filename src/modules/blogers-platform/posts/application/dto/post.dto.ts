export class CreatePostDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

//blogId берётся из url (PUT /sa/blogs/:blogId/posts/:postId), а не из тела запроса
export class UpdatePostDto {
  postId: string;
  blogId: string;
  title: string;
  shortDescription: string;
  content: string;
}

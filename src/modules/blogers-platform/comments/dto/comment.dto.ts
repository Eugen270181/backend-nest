export type CreateCommentDto = {
  content: string;
  postId: string;
  userId: string;
};

export type UpdateCommentDto = {
  content: string; // min 20 max 300
  commentId: string;
};

import { CreateCommentDomainDto } from './dto/create-comment.domain.dto';
import { UpdateCommentDomainDto } from './dto/update-comment.domain.dto';

//Доменная сущность без ORM-декораторов: хранение в Postgres (raw SQL),
//всю работу с таблицей comments делает CommentsRepository.
//userLogin и лайки в сущности нет: логин берётся JOIN-ом из users, лайки считаются из comment_likes.
export class Comment {
  //генерируется базой (gen_random_uuid) - до первого INSERT его ещё нет
  id: string | null = null;

  postId: string;
  userId: string;
  content: string;

  //заполняются базой (DEFAULT now()), репозиторий пишет их обратно в объект
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null = null;

  static createComment(dto: CreateCommentDomainDto): Comment {
    const comment = new this();

    comment.postId = dto.postId;
    comment.userId = dto.userId;
    comment.content = dto.content;

    return comment;
  }

  update(dto: UpdateCommentDomainDto) {
    this.content = dto.content;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Comment Entity already deleted');
    }
    this.deletedAt = new Date();
  }
}

//алиас, чтобы остальной код (usecases/queries) читался как раньше
export type CommentDocument = Comment;

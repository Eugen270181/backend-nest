import { CreatePostDomainDto } from './dto/create-post.domain.dto';
import { UpdatePostDomainDto } from './dto/update-post.domain.dto';

//Доменная сущность без ORM-декораторов: хранение теперь в Postgres (raw SQL),
//всю работу с таблицей posts делает PostsRepository.
//blogName в сущности нет: имя блога достаём JOIN-ом из blogs при чтении (view).
//Лайки пока не в SQL - во view они отдаются заглушкой (см. ExtendedLikesInfo).
export class Post {
  //генерируется базой (gen_random_uuid) - до первого INSERT его ещё нет
  id: string | null = null;

  blogId: string;
  title: string;
  shortDescription: string;
  content: string;

  //заполняются базой (DEFAULT now()), репозиторий пишет их обратно в объект
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null = null;

  static createPost(dto: CreatePostDomainDto): Post {
    const post = new this();

    post.blogId = dto.blogId;
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;

    return post;
  }

  update(dto: UpdatePostDomainDto) {
    this.title = dto.title;
    this.shortDescription = dto.shortDescription;
    this.content = dto.content;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Post Entity already deleted');
    }
    this.deletedAt = new Date();
  }
}

//АЛИАС: раньше PostDocument = HydratedDocument<Post>, теперь это просто Post.
export type PostDocument = Post;

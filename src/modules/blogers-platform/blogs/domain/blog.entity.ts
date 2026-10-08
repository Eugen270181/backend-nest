import { CreateBlogDomainDto } from './dto/create-blog.domain.dto';
import { UpdateBlogDomainDto } from './dto/update-blog.domain.dto';

//Доменная сущность без ORM-декораторов: хранение теперь в Postgres (raw SQL),
//всю работу с таблицей blogs делает BlogsRepository
export class Blog {
  //генерируется базой (gen_random_uuid) - до первого INSERT его ещё нет
  id: string | null = null;

  name: string;
  description: string;
  websiteUrl: string;
  isMembership: boolean = false;

  //заполняются базой (DEFAULT now()), репозиторий пишет их обратно в объект
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null = null;

  static createBlog(dto: CreateBlogDomainDto): Blog {
    const blog = new this();

    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;

    return blog;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Blog Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  update(dto: UpdateBlogDomainDto) {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }
}

//АЛИАС: раньше BlogDocument = HydratedDocument<Blog>, теперь это просто Blog.
//Благодаря этому use-case'ы и query-handler'ы, импортирующие BlogDocument, не меняются.
export type BlogDocument = Blog;

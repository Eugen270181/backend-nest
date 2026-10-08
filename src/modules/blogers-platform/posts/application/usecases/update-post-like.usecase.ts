import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { GetPostDocumentQuery } from '../queries/get-post-document.query';
import { PostDocument } from '../../domain/post.entity';
import { LikePostDto } from '../../../likes/application/dto/like-post.dto';

export class UpdatePostLikeCommand {
  constructor(public readonly dto: LikePostDto) {}
}

//ЗАГЛУШКА: лайки постов пока не переведены в SQL (счётчиков в posts больше нет).
//Проверяем только, что пост существует (404), и ничего не сохраняем -> 204.
//TODO: когда появится таблица лайков - вернуть сюда обновление лайка (см. likes/*)
@CommandHandler(UpdatePostLikeCommand)
export class UpdatePostLikeUseCase
  implements ICommandHandler<UpdatePostLikeCommand>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute({ dto }: UpdatePostLikeCommand) {
    await this.queryBus.execute<GetPostDocumentQuery, PostDocument>(
      new GetPostDocumentQuery(dto.postId),
    );
  }
}

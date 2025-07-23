import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { FilterQuery } from 'mongoose';
import { Blog, BlogDocument, BlogModelType } from '../../domain/blog.entity';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs-query-params.input-dto';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectModel(Blog.name)
    private readonly BlogModel: BlogModelType,
  ) {
    console.log('BlogsQueryRepository created');
  }

  async findById(id: string): Promise<BlogDocument | null> {
    return this.BlogModel.findOne({
      _id: id,
      deletedAt: null,
    }).catch(() => null);
  }

  async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    const blogDocument = await this.findById(id);

    if (!blogDocument) {
      throw new NotFoundException('blog not found');
    }

    return BlogViewDto.mapToView(blogDocument);
  }

  async getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const filter: FilterQuery<Blog> = {
      deletedAt: null,
    };

    if (query.searchNameTerm) {
      filter.$or = filter.$or || [];
      filter.$or.push({
        name: { $regex: query.searchNameTerm, $options: 'i' },
      });
    }

    //console.log('query', JSON.stringify(query));
    const blogs: BlogDocument[] = await this.BlogModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .lean();
    const totalCount = await this.BlogModel.countDocuments(filter);

    const items: BlogViewDto[] = blogs.map((el: BlogDocument) =>
      BlogViewDto.mapToView(el),
    );

    return PaginatedViewDto.mapToView<BlogViewDto[]>({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}

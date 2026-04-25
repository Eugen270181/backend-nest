import { App } from 'supertest/types';
import { BlogDto, testingDtosCreator } from '../../testingDtosCreator';
import { BlogViewDto } from '../../../src/modules/blogers-platform/blogs/api/view-dto/blog.view-dto';
import request from 'supertest';
import { PaginatedViewDto } from '../../../src/core/dto/base.paginated.view-dto';
import { fullPathTo } from '../../getFullPath';
import { AuthCredentials } from '../../users/util/createGetUsers';

export const createBlog = async (
  server: App,
  creds: AuthCredentials,
  blogDto?: BlogDto,
): Promise<BlogViewDto> => {
  const dto = blogDto ?? testingDtosCreator.createBlogDto({});

  const resp = await request(server)
    .post(fullPathTo.blogs)
    .auth(creds.login, creds.password)
    .send(dto)
    .expect(201);

  return resp.body as BlogViewDto;
};

export const getBlogs = async (
  server: App,
): Promise<PaginatedViewDto<BlogViewDto>> => {
  const resp = await request(server).get(fullPathTo.blogs).expect(200);

  return resp.body as PaginatedViewDto<BlogViewDto>;
};

export const getBlogsQty = async (server: App): Promise<number> =>
  (await getBlogs(server)).totalCount;

export const getBlogById = async (
  server: App,
  blogId: string,
): Promise<BlogViewDto> => {
  const resp = await request(server)
    .get(`${fullPathTo.blogs}/${blogId}`)
    .expect(200);

  return resp.body as BlogViewDto;
};

export const createBlogs = async (
  server: App,
  creds: AuthCredentials,
  count: number,
): Promise<BlogViewDto[]> => {
  const blogs: BlogViewDto[] = [];

  const blogDtos: BlogDto[] = testingDtosCreator.createBlogDtos(count);

  for (let i = 0; i < count; i++) {
    const resp = await request(server)
      .post(fullPathTo.blogs)
      .auth(creds.login, creds.password)
      .send(blogDtos[i])
      .expect(201);
    blogs.push(resp.body as BlogViewDto);
  }

  return blogs;
};

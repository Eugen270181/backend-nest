//класс view модели для запросов за списком с пагинацией
export abstract class PaginatedViewDto<T> {
  abstract items: T;
  totalCount: number;
  pagesCount: number;
  page: number;
  pageSize: number;

  //статический метод-утилита для мапинга
  public static mapToView<T>(data: {
    items: T;
    totalCount: number;
    page: number;
    pageSize: number;
  }): PaginatedViewDto<T> {
    return {
      items: data.items,
      totalCount: data.totalCount,
      pagesCount: Math.ceil(data.totalCount / data.pageSize),
      page: data.page,
      pageSize: data.pageSize,
    };
  }
}

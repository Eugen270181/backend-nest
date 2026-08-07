export class UserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: Date;

  //маппер принимает строку таблицы users (snake_case)
  static mapRowToView(row: any): UserViewDto {
    const dto = new UserViewDto();

    dto.id = row.id;
    dto.login = row.login;
    dto.email = row.email;
    dto.createdAt = row.created_at;

    return dto;
  }
}

export class MeViewDto {
  email: string;
  login: string;
  userId: string;

  //маппер принимает строку таблицы users (snake_case)
  static mapRowToView(row: any): MeViewDto {
    const dto = new MeViewDto();

    dto.email = row.email;
    dto.login = row.login;
    dto.userId = row.id;

    return dto;
  }
}

export class UserExternalViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: Date;
  // firstName: string;
  // lastName: string | null;

  //маппер принимает строку таблицы users (snake_case)
  static mapRowToView(row: any): UserExternalViewDto {
    const dto = new UserExternalViewDto();

    dto.email = row.email;
    dto.login = row.login;
    dto.id = row.id;
    dto.createdAt = row.created_at;
    //dto.firstName = row.first_name;
    //dto.lastName = row.last_name;

    return dto;
  }
}

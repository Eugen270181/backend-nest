export class SessionViewDto {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;

  //строка таблицы sessions (snake_case) -> view (camelCase)
  static mapRowToView(row: any): SessionViewDto {
    const dto = new SessionViewDto();

    dto.ip = row.ip;
    dto.title = row.title;
    dto.lastActiveDate = row.last_active_date.toISOString();
    dto.deviceId = row.device_id;

    return dto;
  }
}

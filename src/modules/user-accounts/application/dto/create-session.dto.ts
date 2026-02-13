export class CreateSessionDto {
  deviceId: string;
  userId: string;
  ip: string;
  title: string;
  lastActiveDate: Date;
  expDate: Date;
}

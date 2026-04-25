export class CreateSessionDto {
  deviceId: string;
  userId: string;
  ip: string;
  title: string;
  tokenVersion: string;
  lastActiveDate: Date;
  expDate: Date;
}

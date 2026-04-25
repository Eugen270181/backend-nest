export class RefreshTokenPayloadDto {
  userId: string;
  deviceId: string;
  ver: string;
  iat: number;
  exp: number;
}

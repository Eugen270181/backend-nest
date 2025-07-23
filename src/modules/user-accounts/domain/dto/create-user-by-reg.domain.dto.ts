export class CreateUserByRegDomainDto {
  login: string;
  email: string;
  passwordHash: string;
  code: string;
  date: Date;
}

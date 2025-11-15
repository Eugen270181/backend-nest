import { EmailConfirmation } from '../../../domain/email-confirmation.schema';

export enum UserSearchType {
  Id = 'id',
  Login = 'login',
  Email = 'email',
  LoginOrEmail = 'loginOrEmail',
  RegConfirmCode = 'code',
  PassConfirmCode = 'recoveryCode',
}

//если специфических кодов будет много лучше разнести их в соответствующие модули
export enum DomainExceptionCode {
  //common
  NotFound = `NotFound`,
  BadRequest = `BadRequest`,
  InternalServerError = `InternalServerError`,
  Forbidden = `Forbidden`,
  ValidationError = `ValidationError`,
  NotUnique = `NotUnique`,
  //auth
  Unauthorized = `Unauthorized`,
  EmailNotConfirmed = `EmailNotConfirmed`,
  ConfirmationCodeExpired = `ConfirmationCodeExpired`,
  PasswordRecoveryCodeExpired = `PasswordRecoveryCodeExpired`,
  //...
}

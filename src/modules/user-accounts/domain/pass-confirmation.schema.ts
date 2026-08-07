//простой вложенный объект юзера; в Postgres хранится развёрнуто
//в колонках pass_confirmation_code / pass_expiration_date
export class PassConfirmation {
  confirmationCode: string;
  expirationDate: Date;
}

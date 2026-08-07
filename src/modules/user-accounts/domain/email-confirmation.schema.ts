//простой вложенный объект юзера; в Postgres хранится развёрнуто
//в колонках email_confirmation_code / email_expiration_date
export class EmailConfirmation {
  confirmationCode: string;
  expirationDate: Date;
}

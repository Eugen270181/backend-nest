import { EmailType } from '../../../../core/dto/enum/email-type.enum';

export class SendUserEmailCodeEvent {
  constructor(
    public readonly email: string,
    public readonly confirmationCode: string,
    public readonly type: EmailType,
  ) {}
}

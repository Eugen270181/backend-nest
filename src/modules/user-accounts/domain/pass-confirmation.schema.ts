import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  _id: false,
})
export class PassConfirmation {
  @Prop({ type: String, required: true })
  confirmationCode: string;

  @Prop({ type: Date, required: true })
  expirationDate: Date;
}

export const PassConfirmationSchema =
  SchemaFactory.createForClass(PassConfirmation);

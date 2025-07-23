export class ErrorsMessages {
  message: string;
  field: string;

  static createInstance(message: string, field: string) {
    const errMsg = new this();

    errMsg.message = message;
    errMsg.field = field;

    return errMsg;
  }
}
export class OutputErrors {
  errorsMessages: ErrorsMessages[];

  static createInstance(messages?: ErrorsMessages[]) {
    const outputErr = new this();

    outputErr.errorsMessages = messages ?? [];

    return outputErr;
  }

  pushError(error: ErrorsMessages) {
    this.errorsMessages.push(error);
  }
}

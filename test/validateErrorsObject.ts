import { ErrorResponseBody } from '../src/core/exceptions/filters/error-responce-body.type';

export type errorsMessagesType = { message: string; field: string };
export type OutputErrorsType = {
  errorsMessages: errorsMessagesType[];
};

export const validateErrorsObject = (
  errorsObj: ErrorResponseBody,
  expectedErrorsFields: Array<string>,
) => {
  expect(errorsObj.errorsMessages).toBeDefined();
  if (!errorsObj.errorsMessages) return;
  const expectedErrorsFieldsSet = new Set(expectedErrorsFields);
  const receivedErrorsFieldsSet = new Set(
    errorsObj.errorsMessages.map((error) => error.field),
  );

  expect(expectedErrorsFieldsSet).toEqual(receivedErrorsFieldsSet);
};

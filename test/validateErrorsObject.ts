import { ErrorResponseBody } from '../src/core/exceptions/filters/error-responce-body.type';

export type errorsMessagesType = { message: string; field: string };
export type OutputErrorsType = {
  errorsMessages: errorsMessagesType[];
};

export const validateErrorsObject = (
  errorsObj: ErrorResponseBody,
  expectedErrorsFields: Array<string>,
) => {
  expect(errorsObj.errorMessages).toBeDefined();
  if (!errorsObj.errorMessages) return;
  const expectedErrorsFieldsSet = new Set(expectedErrorsFields);
  const receivedErrorsFieldsSet = new Set(
    errorsObj.errorMessages.map((error) => error.field),
  );

  expect(expectedErrorsFieldsSet).toEqual(receivedErrorsFieldsSet);
};

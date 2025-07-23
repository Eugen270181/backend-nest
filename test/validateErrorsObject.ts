export type errorsMessagesType = { message: string; field: string };
export type OutputErrorsType = {
  errorsMessages: errorsMessagesType[];
};

export const validateErrorsObject = (
  errorsObj: OutputErrorsType,
  expectedErrorsFields: Array<string>,
) => {
  const expectedErrorsFieldsSet = new Set(expectedErrorsFields);
  const receivedErrorsFieldsSet = new Set(
    errorsObj.errorsMessages.map((error) => error.field),
  );

  expect(expectedErrorsFieldsSet).toEqual(receivedErrorsFieldsSet);
};

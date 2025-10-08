import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description: 'Paginated response',
      schema: {
        allOf: [
          {
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              totalCount: {
                type: 'number',
                example: 100,
              },
              pagesCount: {
                type: 'number',
                example: 10,
              },
              page: {
                type: 'number',
                example: 1,
              },
              pageSize: {
                type: 'number',
                example: 10,
              },
            },
          },
        ],
      },
    }),
  );
};

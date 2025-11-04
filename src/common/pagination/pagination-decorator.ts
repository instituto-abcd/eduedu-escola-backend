import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiResponseOptions,
  getSchemaPath,
} from '@nestjs/swagger';
import { PaginationInfo } from './pagination-info-response.dto';
import { PaginationResponse } from './pagination-response.dto';

type Options = Omit<ApiResponseOptions, 'schema'>;

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
  options?: Options,
) => {
  return applyDecorators(
    ApiExtraModels(PaginationResponse, model),
    ApiOkResponse({
      ...options,
      schema: {
        allOf: [
          {
            $ref: getSchemaPath(PaginationResponse),
          },
        ],
        properties: {
          items: {
            type: 'array',
            items: { $ref: getSchemaPath(model) },
          },
          pagination: { $ref: getSchemaPath(PaginationInfo) },
        },
      },
    }),
  );
};

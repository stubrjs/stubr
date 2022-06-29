import { OpenAPIV3 } from 'openapi-types';
import { Method } from '../@types/enums';

const extractSchema: Function = (
    operationObject: OpenAPIV3.OperationObject,
    responseObject: OpenAPIV3.ResponseObject,
    mediaType: string
): ApiSchema => {
    // request body schema for provided media type
    const requestBodySchema: any = (
        operationObject?.requestBody as OpenAPIV3.RequestBodyObject
    )?.content?.[mediaType]?.schema;

    const responseBodySchema: any =
        responseObject?.content?.[mediaType]?.schema;

    const apiSchema: ApiSchema = {
        parameters: operationObject?.parameters?.map((parameter) => {
            const castedParameter: OpenAPIV3.ParameterObject =
                parameter as OpenAPIV3.ParameterObject;

            return {
                in: castedParameter.in as ParameterIn,
                name: castedParameter.name,
                required: castedParameter.required,
                schema: castedParameter.schema,
            };
        }),
        requestBody: requestBodySchema
            ? {
                  schema: requestBodySchema,
              }
            : undefined,
        responseBody: responseBodySchema
            ? {
                  schema: responseBodySchema,
              }
            : undefined,
    };

    return apiSchema;
};

export { extractSchema };

import type { OpenAPIV3 } from 'openapi-types';
import { type } from 'os';
import { Method } from '../@types/enums';
import { extractExample } from './extract-example';

const parseSpecAsScenarios = (api: OpenAPIV3.Document): Promise<Scenario[]> =>
    new Promise((resolve) => {
        const scenarios: Scenario[] = [];

        Object.keys(api.paths || []).forEach((path: string) => {
            const apiMethods: string[] = Object.keys(api.paths?.[path] || {});
            /*
                .map((method) => method.toUpperCase() as Method)
                .filter((method) => Object.values(Method).includes(method));
                */

            apiMethods.forEach((apiMethod: string) => {
                const castedMethod: Method = apiMethod.toUpperCase() as Method;

                // check if method is legit
                if (!Object.values(Method).includes(castedMethod)) {
                    // skip further evaluation if not
                    return;
                }

                const operationObject: OpenAPIV3.OperationObject | undefined =
                    api.paths?.[path]?.[apiMethod as OpenAPIV3.HttpMethods];

                Object.keys(operationObject?.responses || {})?.forEach(
                    (code: string) => {
                        const maybeResponseObject:
                            | OpenAPIV3.ResponseObject
                            | OpenAPIV3.ReferenceObject
                            | undefined = operationObject?.responses?.[code];

                        if (
                            !maybeResponseObject ||
                            !(maybeResponseObject as OpenAPIV3.ResponseObject)
                                .content
                        ) {
                            return;
                        }

                        const responseObject: OpenAPIV3.ResponseObject =
                            maybeResponseObject as OpenAPIV3.ResponseObject;

                        const mediaTypes: string[] = Object.keys(
                            responseObject?.content || {}
                        );

                        mediaTypes.forEach((mediaType: string) => {
                            const mediaTypeObject:
                                | OpenAPIV3.MediaTypeObject
                                | undefined =
                                responseObject?.content?.[mediaType];

                            const example: any =
                                extractExample(mediaTypeObject);

                            scenarios.push({
                                group: `${api.info.title}`,
                                name: `${operationObject?.operationId} - ${code}`,
                                route: path,
                                method: castedMethod,
                                validationRules: {},
                                responseHeaders: {
                                    'Content-Type': mediaType,
                                },
                                responseCode: parseInt(code),
                                responseBody: example,
                            });
                        });
                    }
                );
            });
        });

        console.log(scenarios);

        resolve(scenarios);
    });

export { parseSpecAsScenarios };

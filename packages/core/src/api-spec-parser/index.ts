const debug = require('debug')('stubr');
import logger from '../utils/logger';
import * as path from 'path';
import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPI, OpenAPIV3 } from 'openapi-types';
import { parseSpecAsScenarios } from './parse-to-scenario';

const parseSwaggerSpecs = (
    swaggerSpecObjectsOrPaths: string[]
): Promise<SpecParserResult> =>
    new Promise(async (resolve) => {
        const swaggerParser = new SwaggerParser();
        const errors: string[] = [];
        const scenarios: Scenario[] = [];

        await Promise.all(
            swaggerSpecObjectsOrPaths.map(async (swaggerSpecObjectsOrPath) => {
                debug(`parsing swagger specs "${swaggerSpecObjectsOrPath}"`);

                try {
                    let api: OpenAPI.Document = await swaggerParser.dereference(
                        swaggerSpecObjectsOrPath
                    );

                    // check if it is OpenApi v3
                    const openApiMajorVersion = parseInt(
                        (api as OpenAPIV3.Document)?.openapi?.split('.')?.[0]
                    );
                    if (openApiMajorVersion < 3) {
                        errors.push(
                            `unsupported OpenAPI version specs provided at path "${path.resolve(
                                swaggerSpecObjectsOrPath
                            )}"`
                        );
                        return;
                    }

                    const result: Scenario[] = await parseSpecAsScenarios(
                        api as OpenAPIV3.Document
                    );

                    result.forEach((scenario: Scenario) => {
                        scenarios.push(scenario);
                    });
                } catch (err) {
                    errors.push(
                        `failed to process specs at path "${path.resolve(
                            swaggerSpecObjectsOrPath
                        )}"`
                    );
                    logger.error(
                        'failed to parse specs. Failed with error:',
                        err
                    );
                }
            })
        );

        resolve({
            errors,
            scenarios,
        });
    });

export { parseSwaggerSpecs };

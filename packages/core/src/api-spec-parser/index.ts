const debug = require('debug')('stubr');
import logger from '../utils/logger';
import * as path from 'path';
import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPI } from 'openapi-types';
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

                    const result: Scenario[] = await parseSpecAsScenarios(api);

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

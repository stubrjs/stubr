import type { OpenAPI } from 'openapi-types';
import { Method } from '../@types/enums';

const parseSpecAsScenarios = (api: OpenAPI.Document): Promise<Scenario[]> =>
    new Promise((resolve) => {
        const scenarios: Scenario[] = [];

        if (api.paths) {
            Object.keys(api.paths).forEach((path: string) => {
                console.log(path);
            });
        }

        scenarios.push({
            name: '',
            method: Method.GET,
            responseCode: 200,
            route: '',
        });

        console.log(scenarios);

        resolve(scenarios);
    });

export { parseSpecAsScenarios };

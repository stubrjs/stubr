const debug = require('debug')('stubr');
import * as path from 'path';
import { nanoid } from 'nanoid';
const stackTrace = require('stack-trace');

const enhanceScenario = (scenario: Scenario): Scenario => {
    // extract caller file path
    let _callerFilePath: string = '';
    if (scenario.responseFilePath) {
        const _stackTrace = stackTrace.parse(new Error());

        if (_stackTrace.length >= 3) {
            _callerFilePath = path.dirname(_stackTrace[2].fileName);
        }
    }

    return {
        ...scenario,
        id: scenario.id ? scenario.id : nanoid(),
        responseFilePath: scenario.responseFilePath
            ? path.join(_callerFilePath, scenario.responseFilePath)
            : scenario.responseFilePath,
    };
};

export { enhanceScenario };

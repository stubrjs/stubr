import * as path from 'path';
import { nanoid } from 'nanoid';
const stackTrace = require('stack-trace');

const enhanceScenario = (scenario: Scenario): Scenario => {
    // extract caller file path
    const _stackTrace = stackTrace.parse(new Error());
    let _callerFilePath: string = '';
    if (_stackTrace.length >= 2) {
        _callerFilePath = path.dirname(_stackTrace[1].fileName);
    }

    return {
        ...scenario,
        id: scenario.id ? scenario.id : nanoid(),
        responseFilePath: scenario.responseFilePath
            ? path.join(_callerFilePath, scenario.responseFilePath)
            : scenario.responseFilePath
    };
};

export { enhanceScenario };

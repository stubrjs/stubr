import { enhanceScenario } from '../../utils/transformations';
import { Method } from '../../@types/enums';

test('scenario enhanced if no id provided', () => {
    const _inputScenario: Scenario = {
        method: Method.POST,
        name: 'Test',
        route: '/test',
        validate: () => true,
        responseCode: 200
    };

    const _outputScenario: Scenario = enhanceScenario(_inputScenario);

    expect(_inputScenario.id).toBeUndefined();
    expect(_outputScenario.id).not.toBeUndefined();
});

test('scenario id not altered if already provided', () => {
    const _inputScenario: Scenario = {
        id: 'myId',
        method: Method.POST,
        name: 'Test',
        route: '/test',
        validate: () => true,
        responseCode: 200
    };

    const _outputScenario: Scenario = enhanceScenario(_inputScenario);

    expect(_inputScenario.id).toEqual('myId');
    expect(_outputScenario.id).toEqual('myId');
});

test('response file path properly altered if provided', () => {
    const _inputScenario: Scenario = {
        responseFilePath: './responseFile.json',
        method: Method.POST,
        name: 'Test',
        route: '/test',
        validate: () => true,
        responseCode: 200
    };

    const _outputScenario: Scenario = enhanceScenario(_inputScenario);

    expect(_outputScenario.responseFilePath).toContain(
        '/packages/core/src/__tests__/utils/responseFile.json'
    );
});

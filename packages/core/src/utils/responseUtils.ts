const debug = require('debug')('stubr');
import * as fs from 'fs';
import * as path from 'path';
import * as Koa from 'koa';
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';

import { EventType, ErrorCode } from '../@types/enums';
import logger from './logger';
import {
    getScenarioMatchesForRouteAndMethod,
    extractPathParams,
} from './routeUtils';

const extractRequestParams = (
    ctx: Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext, any>,
    scenarios: Scenario[]
): {
    [key: string]: string | string[];
} => {
    // extract request query params
    let _requestParams: {
        [key: string]: string | string[];
    } = {
        ...ctx?.request?.query,
    };

    const _filteredScenarios: Scenario[] = getScenarioMatchesForRouteAndMethod(
        ctx.path,
        <Method>ctx.method,
        scenarios
    );

    // merge path params with query params
    if (_filteredScenarios?.length > 0) {
        _requestParams = {
            ...extractPathParams(ctx.path, _filteredScenarios[0]),
            ..._requestParams,
        };
    }

    return _requestParams;
};

const seedResponseWithCase = async (
    ioServer: Server | undefined,
    ctx: Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext, any>,
    scenarios: Scenario[],
    selectedScenario: Scenario,
    logEntryId?: string,
    config?: Config
): Promise<void> => {
    if (selectedScenario.group) {
        ctx.set('X-Stubr-Case-Group', selectedScenario.group);
    }
    if (selectedScenario.name) {
        ctx.set('X-Stubr-Case-Name', selectedScenario.name);
    }

    // populate cors headers
    if (config?.corsEnabled) {
        debug('cors enabled, setting cors header...');
        ctx.set(
            'Access-Control-Allow-Origin',
            config?.corsAllowOrigin ? config?.corsAllowOrigin : '*'
        );
    }

    ctx.status = selectedScenario.responseCode;

    const _requestParams = extractRequestParams(ctx, scenarios);

    // if responseBody is a function pass request headers and body
    // to enable dynamic determination of response body
    if (typeof selectedScenario.responseHeaders == 'function') {
        debug(
            'execute function responseHeaders() since responseHeaders was determined to be a function'
        );
        const _headers = selectedScenario.responseHeaders(
            ctx.request.headers as { [key: string]: string },
            ctx.request.body,
            _requestParams
        );
        if (typeof _headers == 'object') {
            debug('assign responseHeaders after evaluation');
            ctx.set(_headers as { [key: string]: string | string[] });
        } else {
            logger.warn(
                `"responseHeaders" function is supposed to return an object, but has been identified to have return of type ${typeof _headers} for scenario name "${
                    selectedScenario.name
                }"`
            );
        }
    } else if (typeof selectedScenario.responseHeaders == 'object') {
        debug('assign responseHeaders without evaluation');
        ctx.set(selectedScenario.responseHeaders);
    } else if (selectedScenario.responseHeaders) {
        logger.warn(
            `"responseHeaders" are supposed to be an object or function, but have been identified to be of type ${typeof selectedScenario.responseHeaders} for scenario name "${
                selectedScenario.name
            }"`
        );
    }

    if (
        selectedScenario.responseFilePath &&
        typeof selectedScenario.responseFilePath == 'string'
    ) {
        // send file if responseFilePath has been
        const _filePath: string = path.resolve(
            selectedScenario.responseFilePath
        );
        debug(`send file from path: "${_filePath}"`);

        let _stats: any = null;
        let _existsFile: boolean = false;

        try {
            _stats = fs.statSync(_filePath);
            _existsFile = true;
        } catch (err) {
            _existsFile = false;
            const _notfound = ['ENOENT', 'ENAMETOOLONG', 'ENOTDIR'];
            if (_notfound.includes((err as any)?.code)) {
                logger.warn(
                    `could not send file, since it was not found at path "${_filePath}" for scenario name "${selectedScenario.name}"`
                );

                ctx.status = 404;
            }
        }

        if (_existsFile && _stats) {
            ctx.set('Content-Length', _stats.size);
            ctx.attachment(path.basename(_filePath));
            if (_stats.mtime)
                ctx.set('Last-Modified', _stats.mtime.toUTCString());
            if (!ctx.type) ctx.type = path.extname(_filePath);

            ctx.body = fs.createReadStream(_filePath);
        } else {
            ctx.body = { error: 'file not found' };
        }
    } else if (typeof selectedScenario.responseBody == 'function') {
        debug(
            'execute function responseBody() since responseBody was determined to be a function'
        );
        try {
            ctx.body = await selectedScenario.responseBody(
                ctx.request.headers as { [key: string]: string },
                ctx.request.body,
                _requestParams
            );
        } catch (err) {
            ctx.status = 500;
            ctx.body = {
                errorType: 'internal server error',
                message: `Execution of responseBody function failed. Received error: ${err}`,
            };
            logger.error(
                `responseBody function failed for scenario with name "${selectedScenario.name}". Received error: "${err}"`
            );
        }
    } else if (selectedScenario.responseBody) {
        debug('assign responseBody without evaluation');
        ctx.body = selectedScenario.responseBody;
    }

    const _logEntry: LogEntry = {
        id: logEntryId || nanoid(),
        group: selectedScenario.group,
        name: selectedScenario.name,
        route: selectedScenario.route,
        method: selectedScenario.method,
        intercepted: false,
        request: {
            headers: ctx.request.headers,
            body: ctx.request.body,
            params: _requestParams,
        },
        response: {
            status: ctx.status,
            headers: ctx.response.headers,
            hasSentFile:
                selectedScenario.responseFilePath !== undefined &&
                selectedScenario.responseFilePath !== null &&
                ctx.status < 400,
            body: ctx.body,
        },
    };

    if (
        !logEntryId &&
        selectedScenario.delay &&
        typeof selectedScenario.delay == 'number'
    ) {
        _logEntry.delay = selectedScenario.delay;
    }

    debug(`[io] emit event "${EventType.LOG_ENTRY}" with payload:`, _logEntry);
    ioServer?.emit(EventType.LOG_ENTRY, _logEntry);
    logger.info(JSON.stringify(_logEntry));
};

const composeErrorLogEntry = (
    ctx: Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext, any>,
    scenarios: Scenario[],
    errorCode: ErrorCode,
    errorMessage: string
): LogEntry => {
    return {
        id: nanoid(),
        route: ctx.path,
        method: <Method>ctx.method,
        intercepted: false,
        request: {
            headers: ctx.request.headers,
            body: ctx.request.body,
            params: extractRequestParams(ctx, scenarios),
        },
        response: {
            status: ctx.status,
            headers: ctx.response.headers,
            hasSentFile: false,
            body: ctx.body,
        },
        error: {
            code: errorCode,
            message: errorMessage,
        },
    };
};

export { extractRequestParams, seedResponseWithCase, composeErrorLogEntry };

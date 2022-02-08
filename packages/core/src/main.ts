const debug = require('debug')('stubr');
import * as path from 'path';
import logger from './utils/logger';
import * as Koa from 'koa';
import * as koaServe_ from 'koa-static';
const koaServe = koaServe_;
import * as bodyParser_ from 'koa-bodyparser';
const bodyParser = bodyParser_;
import * as xmlParser_ from 'koa-xml-body';
const xmlParser = xmlParser_;
import { Server, Socket } from 'socket.io';
import { nanoid } from 'nanoid';
import * as http from 'http';

import * as pjson from '../package.json';

import { Method, ErrorCode, EventType } from './@types/enums';

import loadConfiguration from './utils/configuration';
import { enhanceScenario } from './utils/transformations';
import {
    determineRouteConfigurationState,
    extractRouteConfigurations,
    getRouteConfigurationById,
    isInterceptedForRouteAndMethod,
    getScenarioMatchesForRouteAndMethod,
    setRouteInterceptionMarker,
    unsetRouteInterceptionMarkersForSocketId
} from './utils/routeUtils';

import {
    extractRequestParams,
    seedResponseWithCase,
    composeErrorLogEntry
} from './utils/responseUtils';

class Stubr implements IStubr {
    private stubrConfig: Config = {};
    private mockServer: Koa = new Koa();
    private uiServer: http.Server | undefined;
    private io: Server | undefined;
    private scenarios: Scenario[] = [];
    private routeConfigurations: RouteConfiguration[] = [];
    private interceptionMarkers: RouteInterceptionMarkerAudit[] = [];
    private interceptions: RouteInterceptions = {};

    constructor(stubrConfig?: Config) {
        this.stubrConfig = loadConfiguration(stubrConfig);
        this.initMockServer();
        this.initUiServer();

        this.scenarios = [];
        this.routeConfigurations = [];
        this.interceptionMarkers = [];
        this.interceptions = {};
    }

    private initMockServer() {
        debug(`current working dir: "${path.resolve(process.cwd())}"`);
        this.mockServer.use(
            xmlParser({
                onerror: (err, ctx) => {
                    logger.warn(
                        `failed to parse body as xml with status "${
                            (err as any)?.status
                        }" and message "${err?.message}"`
                    );
                }
            })
        );
        this.mockServer.use(bodyParser());
    }

    private startMockServer() {
        this.mockServer.listen(this.stubrConfig.stubsPort, () => {
            logger.info(`started stubr on port: ${this.stubrConfig.stubsPort}`);
        });
    }

    private initUiServer() {
        const app = new Koa();
        const _staticFilesDirectory = path.resolve(__dirname, '../static');
        debug(`serve static files from "${_staticFilesDirectory}"`);
        app.use(koaServe(_staticFilesDirectory));
        this.uiServer = require('http').createServer(app.callback());
        if (this.uiServer) {
            this.io = new Server(this.uiServer, {
                cors: {
                    origin: 'http://localhost:8080',
                    methods: ['GET', 'POST']
                }
            });
        }
    }

    private startUiServer() {
        this.uiServer?.listen(this.stubrConfig.uiPort, () => {
            logger.info(`started stubr UI on port: ${this.stubrConfig.uiPort}`);

            this.bindSocketIoListeners();
        });
    }

    private bindSocketIoListeners() {
        this.io?.on(EventType.CONNECT, (socket: Socket) => {
            debug('[io] new client connected:', socket.id);

            this.getRouteConfigurationState().forEach(
                (routeConfig: RouteConfiguration) => {
                    debug(
                        `[io] emit event "${EventType.ROUTE_CONFIG}" with payload:`,
                        routeConfig
                    );
                    socket.emit(EventType.ROUTE_CONFIG, routeConfig);
                }
            );

            socket.on(
                EventType.MARK_ROUTE_FOR_INTERCEPTIONS,
                (event: RouteInterceptionMarker, ack: Function) => {
                    debug(
                        `[io] received route interception event from client "${socket.id}":`,
                        event
                    );

                    setRouteInterceptionMarker(
                        socket.id,
                        event,
                        this.interceptionMarkers
                    );

                    ack(
                        getRouteConfigurationById(
                            event?.routeConfigurationId,
                            this.getRouteConfigurationState()
                        )
                    );

                    // notify all
                    this.io?.emit(
                        EventType.ROUTE_CONFIG,
                        getRouteConfigurationById(
                            event?.routeConfigurationId,
                            this.getRouteConfigurationState()
                        )
                    );
                }
            );

            socket.on(
                EventType.RESOLVE_INTERCEPTION,
                (event: ResolveInterception) => {
                    if (event.logEntryId && event.scenarioId) {
                        if (
                            typeof this.interceptions[event.logEntryId] ==
                            'function'
                        ) {
                            this.interceptions[event.logEntryId](
                                event.scenarioId
                            );
                            debug(
                                `currently intercepted requests: ${Object.keys(
                                    this.interceptions
                                ) || 'none'}`
                            );
                        } else {
                            debug(
                                `no interception found for logEntryId "${event.logEntryId}"`
                            );
                        }
                    } else {
                        logger.warn(
                            `payload received for ${EventType.RESOLVE_INTERCEPTION} event does not fulfill requirements`
                        );
                    }
                }
            );

            socket.on(EventType.DISCONNECT, () => {
                debug('[io] client disconnected:', socket.id);
                unsetRouteInterceptionMarkersForSocketId(
                    socket.id,
                    this.routeConfigurations,
                    this.interceptionMarkers,
                    this.io
                );
            });
        });
    }

    private getRouteConfigurationState(): RouteConfiguration[] {
        return determineRouteConfigurationState(
            this.routeConfigurations,
            this.interceptionMarkers
        );
    }

    public register(scenario: Scenario): void {
        this.scenarios.push(enhanceScenario(scenario));
    }

    public run(): void {
        debug('run() stubr with config: ', this.stubrConfig);

        // version
        this.mockServer.use(async (ctx, next) => {
            await next();
            ctx.set('X-Stubr-Version', `v${(<any>pjson).version}`);
        });

        // x-response-time

        this.mockServer.use(async (ctx, next) => {
            const start = Date.now();
            await next();
            const ms = Date.now() - start;
            ctx.set('X-Response-Time', `${ms}ms`);
        });

        // response

        this.mockServer.use(
            async (
                ctx: Koa.ParameterizedContext<
                    Koa.DefaultState,
                    Koa.DefaultContext,
                    any
                >,
                next
            ) => {
                const _params = extractRequestParams(ctx, this.scenarios);

                const _filteredScenarios: Scenario[] = getScenarioMatchesForRouteAndMethod(
                    ctx.path,
                    <Method>ctx.method,
                    this.scenarios
                );

                if (
                    isInterceptedForRouteAndMethod(
                        ctx.path,
                        <Method>ctx.method,
                        this.getRouteConfigurationState()
                    )
                ) {
                    const _logEntry: LogEntry = {
                        id: nanoid(),
                        route: ctx.path,
                        method: <Method>ctx.method,
                        intercepted: true,
                        request: {
                            headers: ctx.request.headers,
                            body: ctx.request.body,
                            params: _params
                        },
                        scenarios: _filteredScenarios.map(
                            (
                                scenario: Scenario
                            ): {
                                id: string | undefined;
                                group: string | undefined;
                                name: string;
                            } => {
                                return {
                                    id: scenario.id,
                                    group: scenario.group,
                                    name: scenario.name
                                };
                            }
                        )
                    };

                    debug(
                        `[io] emit event "${EventType.LOG_ENTRY}" with payload:`,
                        _logEntry
                    );
                    this.io?.emit(EventType.LOG_ENTRY, _logEntry);
                    logger.info(JSON.stringify(_logEntry));

                    await new Promise<void>(resolve => {
                        this.interceptions[_logEntry.id] = (
                            scenarioId: string
                        ) => {
                            const _selectedScenario:
                                | Scenario
                                | undefined = _filteredScenarios.find(
                                (scenario: Scenario): boolean => {
                                    return scenario.id == scenarioId;
                                }
                            );

                            if (_selectedScenario) {
                                seedResponseWithCase(
                                    this.io,
                                    ctx,
                                    this.scenarios,
                                    _selectedScenario,
                                    _logEntry.id
                                );
                                resolve();
                                debug(
                                    `resolved interception for request with id "${_logEntry.id}" with scenario with id "${scenarioId}"`
                                );
                                delete this.interceptions[_logEntry.id];
                            } else {
                                logger.error(
                                    `could find scenario with id "${scenarioId}" for request with id "${_logEntry.id}" und thus not resolve the request`
                                );
                            }
                        };
                        debug(
                            `currently intercepted requests: ${Object.keys(
                                this.interceptions
                            )}`
                        );
                    });
                } else {
                    const _scenarioMatch:
                        | Scenario
                        | undefined = _filteredScenarios.find(
                        (scenario: Scenario): boolean => {
                            if (typeof scenario.validate == 'function') {
                                debug(
                                    `execute function validate() for scenario with name "${scenario.name}"`
                                );
                                const _isValid = scenario.validate(
                                    ctx.request.headers as {
                                        [key: string]: string;
                                    },
                                    ctx.request.body,
                                    _params
                                );

                                if (_isValid) {
                                    debug(
                                        `found match for scenario with name "${scenario.name}"`
                                    );
                                }
                                return _isValid;
                            } else {
                                logger.warn(
                                    `scenario with name "${scenario.name}" cannot be automatically reached since function validate() is not defined`
                                );
                            }
                            return false;
                        }
                    );

                    // resolve match
                    if (_scenarioMatch) {
                        if (
                            _scenarioMatch.delay &&
                            typeof _scenarioMatch.delay == 'number'
                        ) {
                            debug(
                                `waiting for ${_scenarioMatch.delay}ms before resolving request...`
                            );
                            await new Promise<void>(resolve => {
                                setTimeout(() => {
                                    debug(`proceeding with resolving request`);
                                    resolve();
                                }, _scenarioMatch.delay);
                            });
                        }

                        if (
                            _scenarioMatch.delay &&
                            typeof _scenarioMatch.delay != 'number'
                        ) {
                            logger.warn(
                                'property delay is only allowed to receive values of type "number"'
                            );
                        }

                        seedResponseWithCase(
                            this.io,
                            ctx,
                            this.scenarios,
                            _scenarioMatch
                        );
                    }

                    if (_filteredScenarios.length == 0) {
                        const _errorMessage = 'route not defined';
                        ctx.body = { error: _errorMessage };
                        ctx.status = 404;

                        const _logEntry: LogEntry = composeErrorLogEntry(
                            ctx,
                            this.scenarios,
                            ErrorCode.NO_ROUTE_MATCH,
                            _errorMessage
                        );

                        debug(
                            `[io] emit event "${EventType.LOG_ENTRY}" with payload:`,
                            _logEntry
                        );
                        this.io?.emit(EventType.LOG_ENTRY, _logEntry);
                        logger.warn(JSON.stringify(_logEntry));

                        return;
                    }

                    if (!_scenarioMatch && _filteredScenarios.length > 0) {
                        const _errorMessage = 'no matching scenario found';
                        ctx.body = { error: _errorMessage };
                        ctx.status = 404;

                        const _logEntry: LogEntry = composeErrorLogEntry(
                            ctx,
                            this.scenarios,
                            ErrorCode.NO_SCENARIO_MATCH,
                            _errorMessage
                        );

                        debug(
                            `[io] emit event "${EventType.LOG_ENTRY}" with payload:`,
                            _logEntry
                        );
                        this.io?.emit(EventType.LOG_ENTRY, _logEntry);
                        logger.warn(JSON.stringify(_logEntry));
                    }
                }
            }
        );

        this.routeConfigurations = extractRouteConfigurations(this.scenarios);
        this.startMockServer();
        this.startUiServer();
    }
}

export default Stubr;

export { Method };

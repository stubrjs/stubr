const debug = require('debug')('stubr')
import * as fs from 'fs'
import * as path from 'path'
import logger from './utils/logger'
import * as Koa from 'koa'
import * as koaServe_ from 'koa-static'
const koaServe = koaServe_
import * as bodyParser_ from 'koa-bodyparser'
const bodyParser = bodyParser_
import * as xmlParser_ from 'koa-xml-body'
const xmlParser = xmlParser_
import { Server, Socket } from 'socket.io'
import { filter, remove, cloneDeep } from 'lodash'
import uuid = require('uuid/v4')
const stackTrace = require('stack-trace')
import * as http from 'http'

import * as defaultConfig from './defaultconfig.json'
import * as pjson from '../package.json'

import { Method, ErrorCode, EventType } from './@types/enums'

class Stubr implements IStubr {
    private stubrConfig: Config = {}
    private mockServer: Koa = new Koa()
    private uiServer: http.Server | undefined
    private io: Server | undefined
    private scenarios: Scenario[] = []
    private routeConfigurations: RouteConfiguration[] = []
    private interceptionMarkers: RouteInterceptionMarkerAudit[] = []
    private interceptions: RouteInterceptions = {}

    constructor(stubrConfig?: Config) {
        this.loadConfiguration(stubrConfig)
        this.initMockServer()
        this.initUiServer()

        this.scenarios = []
        this.routeConfigurations = []
        this.interceptionMarkers = []
        this.interceptions = {}
    }

    private loadConfiguration(stubrConfig?: Config) {
        if (stubrConfig) {
            debug('use custom config')
            this.stubrConfig = { ...defaultConfig, ...stubrConfig }
        } else {
            debug('use default config')
            this.stubrConfig = <Config>defaultConfig
        }
    }

    private initMockServer() {
        debug(`current working dir: "${path.resolve(process.cwd())}"`)
        this.mockServer.use(
            xmlParser({
                onerror: (err, ctx) => {
                    logger.warn(
                        // @ts-ignore
                        `failed to parse body as xml with status "${err?.status}" and message "${err?.message}"`
                    )
                }
            })
        )
        this.mockServer.use(bodyParser())
    }

    private startMockServer() {
        this.mockServer.listen(this.stubrConfig.stubsPort, () => {
            logger.info(`started stubr on port: ${this.stubrConfig.stubsPort}`)
        })
    }

    private initUiServer() {
        const app = new Koa()
        const _staticFilesDirectory = path.resolve(__dirname, '../static')
        debug(`serve static files from "${_staticFilesDirectory}"`)
        app.use(koaServe(_staticFilesDirectory))
        this.uiServer = require('http').createServer(app.callback())
        if (this.uiServer) {
            this.io = new Server(this.uiServer, {
                cors: {
                    origin: 'http://localhost:8080',
                    methods: ['GET', 'POST']
                }
            })
        }
    }

    private startUiServer() {
        this.uiServer?.listen(this.stubrConfig.uiPort, () => {
            logger.info(`started stubr UI on port: ${this.stubrConfig.uiPort}`)

            this.bindSocketIoListeners()
        })
    }

    private bindSocketIoListeners() {
        this.io?.on(EventType.CONNECT, (socket: Socket) => {
            debug('[io] new client connected:', socket.id)

            this.getRouteConfigurationState().forEach(
                (routeConfig: RouteConfiguration) => {
                    debug(
                        `[io] emit event "${EventType.ROUTE_CONFIG}" with payload:`,
                        routeConfig
                    )
                    socket.emit(EventType.ROUTE_CONFIG, routeConfig)
                }
            )

            socket.on(
                EventType.MARK_ROUTE_FOR_INTERCEPTIONS,
                (event: RouteInterceptionMarker, ack: Function) => {
                    debug(
                        `[io] received route interception event from client "${socket.id}":`,
                        event
                    )
                    this.setRouteInterceptionMarker(socket.id, event)
                    const _foundRouteConfiguration = this.getRouteConfigurationState().find(
                        (routeConfiguration: RouteConfiguration) => {
                            return (
                                routeConfiguration.id ==
                                event.routeConfigurationId
                            )
                        }
                    )
                    ack(_foundRouteConfiguration)

                    // notify all
                    this.io?.emit(
                        EventType.ROUTE_CONFIG,
                        _foundRouteConfiguration
                    )
                }
            )

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
                            )
                            debug(
                                `currently intercepted requests: ${Object.keys(
                                    this.interceptions
                                ) || 'none'}`
                            )
                        } else {
                            debug(
                                `no interception found for logEntryId "${event.logEntryId}"`
                            )
                        }
                    } else {
                        logger.warn(
                            `payload received for ${EventType.RESOLVE_INTERCEPTION} event does not fulfill requirements`
                        )
                    }
                }
            )

            socket.on(EventType.DISCONNECT, () => {
                debug('[io] client disconnected:', socket.id)
                this.unsetRouteInterceptionMarkersForSocketId(socket.id)
            })
        })
    }

    // extract covered route configurations from scenarios
    private extractRouteConfigurations(): void {
        const _routeMap: { [route: string]: Method[] } = {}
        this.scenarios.forEach((scenario: Scenario) => {
            if (!_routeMap[scenario.route]) {
                _routeMap[scenario.route] = [scenario.method]
            } else {
                _routeMap[scenario.route] = [
                    ..._routeMap[scenario.route],
                    scenario.method
                ]
            }
        })

        const _routeConfigurations: RouteConfiguration[] = []
        for (let route in _routeMap) {
            const _methodsArray = _routeMap[route]

            const _methodsArrayWithInterceptionState: Array<MethodContext> = []
            _methodsArray.forEach((method: string) => {
                const _foundEntry = _methodsArrayWithInterceptionState.find(
                    (entry: any): boolean => {
                        return entry.method == method
                    }
                )
                if (!_foundEntry) {
                    _methodsArrayWithInterceptionState.push({
                        method: method,
                        intercepted: false
                    })
                }
            })

            _routeConfigurations.push({
                id: uuid(),
                route: route,
                methods: _methodsArrayWithInterceptionState
            })
        }

        this.routeConfigurations = _routeConfigurations
    }

    private getRouteConfigurationState(): RouteConfiguration[] {
        const _routeConfigurations = cloneDeep(this.routeConfigurations)

        this.interceptionMarkers.forEach(
            (interception: RouteInterceptionMarkerAudit): void => {
                _routeConfigurations.find(
                    (routeConfiguration: RouteConfiguration): boolean => {
                        if (
                            routeConfiguration.id ==
                            interception.routeConfigurationId
                        ) {
                            routeConfiguration.methods.forEach(
                                (methodContext: MethodContext) => {
                                    if (
                                        methodContext.method ==
                                        interception.method
                                    ) {
                                        methodContext.intercepted =
                                            interception.intercepted
                                    }
                                }
                            )
                            return true
                        }
                        return false
                    }
                )
            }
        )

        return _routeConfigurations
    }

    private isRouteMatch(incomingRoute: string, toBeMatchedRoute: string) {
        const _segmentedToBeMatchedRoute: Array<String> = toBeMatchedRoute.split(
            '/'
        )
        const _segmentedIncomingRoute: Array<String> = incomingRoute.split('/')

        if (
            _segmentedToBeMatchedRoute.length !== _segmentedIncomingRoute.length
        ) {
            debug(
                `[route match] incoming route "${incomingRoute}" does not match scenario route "${toBeMatchedRoute}" because of varying route lengths`
            )
            return false
        }

        let _isMatch = true
        _segmentedIncomingRoute.forEach((segment, index) => {
            if (
                (segment && !_segmentedToBeMatchedRoute[index]) ||
                (_segmentedToBeMatchedRoute[index] !== segment &&
                    !(
                        _segmentedToBeMatchedRoute[index].startsWith('{') &&
                        _segmentedToBeMatchedRoute[index].endsWith('}')
                    ))
            ) {
                debug(
                    `[route match] segment "${segment}" of incoming route "${incomingRoute}" does not match scenario route segment "${_segmentedToBeMatchedRoute[index]}" of scenario route "${toBeMatchedRoute}"`
                )
                _isMatch = false
            }
        })

        debug(
            `[route match] incoming route "${incomingRoute}" matches with scenario route "${toBeMatchedRoute}"`
        )

        return _isMatch
    }

    // filter scenarios by matching route and method
    private getScenarioMatchesForRouteAndMethod(
        route: string,
        method: Method
    ): Scenario[] {
        return filter(this.scenarios, scenario => {
            if (scenario.method !== method) {
                return false
            }

            return this.isRouteMatch(route, scenario.route)
        })
    }

    private extractPathParams(route: string, scenario: Scenario): object {
        if (!route || !scenario) {
            return {}
        }

        const _pathParams = {}
        const _segmentedScenarioRoute: Array<String> = scenario.route.split('/')
        const _segmentedRequestRoute: Array<String> = route.split('/')

        function isWildcard(segment) {
            if (!segment || typeof segment !== 'string') return false
            return segment.startsWith('{') && segment.endsWith('}')
        }

        _segmentedRequestRoute.forEach((segment, index) => {
            if (isWildcard(_segmentedScenarioRoute[index])) {
                _pathParams[
                    _segmentedScenarioRoute[index].substring(
                        1,
                        _segmentedScenarioRoute[index].length - 1
                    )
                ] = segment
            }
        })

        return _pathParams
    }

    private isInterceptedForRouteAndMethod(
        route: string,
        method: Method
    ): boolean {
        const _foundRouteConfiguration = this.getRouteConfigurationState().find(
            (routeConfiguration: RouteConfiguration) => {
                return this.isRouteMatch(route, routeConfiguration.route)
            }
        )

        if (_foundRouteConfiguration) {
            return (
                _foundRouteConfiguration.methods.find(
                    (methodContext: MethodContext) => {
                        return (
                            methodContext.method == method &&
                            methodContext.intercepted == true
                        )
                    }
                ) !== undefined
            )
        }

        return false
    }

    private setRouteInterceptionMarker(
        socketId: string,
        routeInterception: RouteInterceptionMarker
    ): void {
        if (routeInterception.intercepted) {
            const _interception:
                | RouteInterceptionMarkerAudit
                | undefined = this.interceptionMarkers.find(
                (interception: RouteInterceptionMarkerAudit): boolean => {
                    return (
                        interception.routeConfigurationId ==
                            routeInterception.routeConfigurationId &&
                        interception.method == routeInterception.method
                    )
                }
            )

            if (_interception) {
                _interception.socketId = socketId
            } else {
                this.interceptionMarkers.push({
                    routeConfigurationId:
                        routeInterception.routeConfigurationId,
                    method: routeInterception.method,
                    intercepted: true,
                    socketId: socketId
                })
            }
        } else {
            remove(
                this.interceptionMarkers,
                (interception: RouteInterceptionMarkerAudit) => {
                    return (
                        interception.routeConfigurationId ==
                            routeInterception.routeConfigurationId &&
                        interception.method == routeInterception.method
                    )
                }
            )
        }
        debug('route interception markers:', this.interceptionMarkers)
    }

    private unsetRouteInterceptionMarkersForSocketId(socketId: string) {
        remove(
            this.interceptionMarkers,
            (interception: RouteInterceptionMarkerAudit) => {
                return interception.socketId == socketId
            }
        )
        debug('route interception markers:', this.interceptionMarkers)

        this.getRouteConfigurationState().forEach(
            (routeConfig: RouteConfiguration) => {
                debug(
                    `[io] emit event "${EventType.ROUTE_CONFIG}" with payload:`,
                    routeConfig
                )

                this.io?.emit(EventType.ROUTE_CONFIG, routeConfig)
            }
        )
    }

    public register(scenario: Scenario): void {
        // extract caller file path
        const _stackTrace = stackTrace.parse(new Error())
        let _callerFilePath: string = ''
        if (_stackTrace.length >= 2) {
            _callerFilePath = path.dirname(_stackTrace[1].fileName)
        }

        debug(`register() caller file path "${_callerFilePath}"`)

        this.scenarios.push({
            ...scenario,
            id: scenario.id ? scenario.id : uuid(),
            responseFilePath: scenario.responseFilePath
                ? path.join(_callerFilePath, scenario.responseFilePath)
                : scenario.responseFilePath
        })
    }

    public run(): void {
        debug('run() stubr with config: ', this.stubrConfig)

        // version
        this.mockServer.use(async (ctx, next) => {
            await next()
            ctx.set('X-Stubr-Version', `v${(<any>pjson).version}`)
        })

        // x-response-time

        this.mockServer.use(async (ctx, next) => {
            const start = Date.now()
            await next()
            const ms = Date.now() - start
            ctx.set('X-Response-Time', `${ms}ms`)
        })

        // response

        this.mockServer.use(async (ctx, next) => {
            const _io: Server | undefined = this.io

            let _params = {
                ...ctx.request.query
            }

            async function seedResponseWithCase(
                ctx: any,
                scenario: Scenario,
                logEntryId?: string
            ): Promise<any> {
                if (scenario.group) {
                    ctx.set('X-Stubr-Case-Group', scenario.group)
                }
                if (scenario.name) {
                    ctx.set('X-Stubr-Case-Name', scenario.name)
                }

                ctx.status = scenario.responseCode

                // if responseBody is a function pass request headers and body
                // to enable dynamic determination of response body
                if (typeof scenario.responseHeaders == 'function') {
                    debug(
                        'execute function responseHeaders() since responseHeaders was determined to be a function'
                    )
                    const _headers = scenario.responseHeaders(
                        ctx.request.headers,
                        ctx.request.body,
                        _params
                    )
                    if (typeof _headers == 'object') {
                        debug('assign responseHeaders after evaluation')
                        ctx.set(_headers)
                    } else {
                        logger.warn(
                            `"responseHeaders" function is supposed to return an object, but has been identified to have return of type ${typeof _headers} for scenario name "${
                                scenario.name
                            }"`
                        )
                    }
                } else if (typeof scenario.responseHeaders == 'object') {
                    debug('assign responseHeaders without evaluation')
                    ctx.set(scenario.responseHeaders)
                } else if (scenario.responseHeaders) {
                    logger.warn(
                        `"responseHeaders" are supposed to be an object or function, but have been identified to be of type ${typeof scenario.responseHeaders} for scenario name "${
                            scenario.name
                        }"`
                    )
                }

                if (
                    scenario.responseFilePath &&
                    typeof scenario.responseFilePath == 'string'
                ) {
                    // send file if responseFilePath has been
                    const _filePath: string = path.resolve(
                        process.cwd(),
                        scenario.responseFilePath
                    )
                    debug(`send file from path: "${_filePath}"`)

                    let _stats: any = null
                    let _existsFile: boolean = false

                    try {
                        _stats = fs.statSync(_filePath)
                        _existsFile = true
                    } catch (err) {
                        _existsFile = false
                        const _notfound = ['ENOENT', 'ENAMETOOLONG', 'ENOTDIR']
                        if (_notfound.includes(err.code)) {
                            logger.warn(
                                `could not send file, since it was not found at path "${_filePath}" for scenario name "${scenario.name}"`
                            )

                            ctx.status = 404
                        }
                    }

                    if (_existsFile && _stats) {
                        ctx.set('Content-Length', _stats.size)
                        ctx.attachment(path.basename(_filePath))
                        if (_stats.mtime)
                            ctx.set('Last-Modified', _stats.mtime.toUTCString())
                        if (!ctx.type) ctx.type = path.extname(_filePath)

                        ctx.body = fs.createReadStream(_filePath)
                    } else {
                        ctx.body = { error: 'file not found' }
                    }
                } else if (typeof scenario.responseBody == 'function') {
                    // if responseBody is a function pass request headers and body
                    // to enable dynamic determination of response body
                    debug(
                        'execute function responseBody() since responseBody was determined to be a function'
                    )
                    ctx.body = scenario.responseBody(
                        ctx.request.headers,
                        ctx.request.body,
                        _params
                    )
                } else if (scenario.responseBody) {
                    debug('assign responseBody without evaluation')
                    ctx.body = scenario.responseBody
                }

                const _logEntry: LogEntry = {
                    id: logEntryId || uuid(),
                    group: scenario.group,
                    name: scenario.name,
                    route: scenario.route,
                    method: scenario.method,
                    intercepted: false,
                    request: {
                        headers: ctx.request.headers,
                        body: ctx.request.body,
                        params: _params
                    },
                    response: {
                        status: ctx.status,
                        headers: ctx.response.headers,
                        hasSentFile:
                            scenario.responseFilePath !== undefined &&
                            scenario.responseFilePath !== null &&
                            ctx.status < 400,
                        body: ctx.body
                    }
                }

                if (
                    !logEntryId &&
                    scenario.delay &&
                    typeof scenario.delay == 'number'
                ) {
                    _logEntry.delay = scenario.delay
                }

                debug(
                    `[io] emit event "${EventType.LOG_ENTRY}" with payload:`,
                    _logEntry
                )
                _io?.emit(EventType.LOG_ENTRY, _logEntry)
                logger.info(JSON.stringify(_logEntry))
            }

            const _filteredScenarios: Scenario[] = this.getScenarioMatchesForRouteAndMethod(
                ctx.path,
                <Method>ctx.method
            )

            // merge path params with query params
            if (_filteredScenarios && _filteredScenarios.length > 0) {
                _params = {
                    ...this.extractPathParams(ctx.path, _filteredScenarios[0]),
                    ..._params
                }
            }

            if (
                this.isInterceptedForRouteAndMethod(
                    ctx.path,
                    <Method>ctx.method
                )
            ) {
                const _logEntry: LogEntry = {
                    id: uuid(),
                    route: ctx.path,
                    method: <Method>ctx.method,
                    intercepted: true,
                    request: {
                        headers: ctx.request.headers,
                        body: ctx.request.body,
                        params: _params
                    },
                    scenarios: _filteredScenarios.map((scenario: Scenario): {
                        id: string | undefined
                        group: string | undefined
                        name: string
                    } => {
                        return {
                            id: scenario.id,
                            group: scenario.group,
                            name: scenario.name
                        }
                    })
                }

                debug(
                    `[io] emit event "${EventType.LOG_ENTRY}" with payload:`,
                    _logEntry
                )
                this.io?.emit(EventType.LOG_ENTRY, _logEntry)
                logger.info(JSON.stringify(_logEntry))

                await new Promise<void>(resolve => {
                    this.interceptions[_logEntry.id] = (scenarioId: string) => {
                        const _selectedScenario:
                            | Scenario
                            | undefined = _filteredScenarios.find(
                            (scenario: Scenario): boolean => {
                                return scenario.id == scenarioId
                            }
                        )

                        if (_selectedScenario) {
                            seedResponseWithCase(
                                ctx,
                                _selectedScenario,
                                _logEntry.id
                            )
                            resolve()
                            debug(
                                `resolved interception for request with id "${_logEntry.id}" with scenario with id "${scenarioId}"`
                            )
                            delete this.interceptions[_logEntry.id]
                        } else {
                            logger.error(
                                `could find scenario with id "${scenarioId}" for request with id "${_logEntry.id}" und thus not resolve the request`
                            )
                        }
                    }
                    debug(
                        `currently intercepted requests: ${Object.keys(
                            this.interceptions
                        )}`
                    )
                })
            } else {
                const _scenarioMatch:
                    | Scenario
                    | undefined = _filteredScenarios.find(
                    (scenario: Scenario): boolean => {
                        if (typeof scenario.validate == 'function') {
                            debug(
                                `execute function validate() for scenario with name "${scenario.name}"`
                            )
                            const _isValid = scenario.validate(
                                ctx.request.headers,
                                ctx.request.body,
                                _params
                            )

                            if (_isValid) {
                                debug(
                                    `found match for scenario with name "${scenario.name}"`
                                )
                            }
                            return _isValid
                        } else {
                            logger.warn(
                                `scenario with name "${scenario.name}" cannot be automatically reached since function validate() is not defined`
                            )
                        }
                        return false
                    }
                )

                // resolve match
                if (_scenarioMatch) {
                    if (
                        _scenarioMatch.delay &&
                        typeof _scenarioMatch.delay == 'number'
                    ) {
                        debug(
                            `waiting for ${_scenarioMatch.delay}ms before resolving request...`
                        )
                        await new Promise<void>(resolve => {
                            setTimeout(() => {
                                debug(`proceeding with resolving request`)
                                resolve()
                            }, _scenarioMatch.delay)
                        })
                    }

                    if (
                        _scenarioMatch.delay &&
                        typeof _scenarioMatch.delay != 'number'
                    ) {
                        logger.warn(
                            'property delay is only allowed to receive values of type "number"'
                        )
                    }

                    seedResponseWithCase(ctx, _scenarioMatch)
                }

                if (_filteredScenarios.length == 0) {
                    const _errorMessage = 'route not defined'
                    ctx.body = { error: _errorMessage }
                    ctx.status = 404

                    const _logEntry: LogEntry = {
                        id: uuid(),
                        route: ctx.path,
                        method: <Method>ctx.method,
                        intercepted: false,
                        request: {
                            headers: ctx.request.headers,
                            params: _params,
                            body: ctx.request.body
                        },
                        response: {
                            status: ctx.status,
                            headers: ctx.response.headers,
                            hasSentFile: false,
                            body: ctx.body
                        },
                        error: {
                            code: ErrorCode.NO_ROUTE_MATCH,
                            message: _errorMessage
                        }
                    }

                    debug(
                        `[io] emit event "${EventType.LOG_ENTRY}" with payload:`,
                        _logEntry
                    )
                    this.io?.emit(EventType.LOG_ENTRY, _logEntry)
                    logger.warn(JSON.stringify(_logEntry))

                    return
                }

                if (!_scenarioMatch && _filteredScenarios.length > 0) {
                    const _errorMessage = 'no matching scenario found'
                    ctx.body = { error: _errorMessage }
                    ctx.status = 404

                    const _logEntry: LogEntry = {
                        id: uuid(),
                        route: ctx.path,
                        method: <Method>ctx.method,
                        intercepted: false,
                        request: {
                            headers: ctx.request.headers,
                            body: ctx.request.body,
                            params: _params
                        },
                        response: {
                            status: ctx.status,
                            headers: ctx.response.headers,
                            hasSentFile: false,
                            body: ctx.body
                        },
                        error: {
                            code: ErrorCode.NO_SCENARIO_MATCH,
                            message: _errorMessage
                        }
                    }

                    debug(
                        `[io] emit event "${EventType.LOG_ENTRY}" with payload:`,
                        _logEntry
                    )
                    this.io?.emit(EventType.LOG_ENTRY, _logEntry)
                    logger.warn(JSON.stringify(_logEntry))
                }
            }
        })

        this.extractRouteConfigurations()
        this.startMockServer()
        this.startUiServer()
    }
}

export default Stubr

export { Method }

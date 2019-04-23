/// <reference path="./typings/main.d.ts" />

const debug = require('debug')('stubr');
import * as http from 'http';
import * as path from 'path';
import logger from './utils/logger';
import * as Koa from 'koa';
import * as koaServe_ from 'koa-static';
const koaServe = koaServe_;
import * as bodyParser_ from 'koa-bodyparser';
const bodyParser = bodyParser_;
import * as socketIo_ from 'socket.io';
const socketIo = socketIo_;
import { filter, remove, cloneDeep } from 'lodash';
import uuid = require('uuid/v4');

import { Method, EventType, ErrorCode } from './typings/enums';
import * as defaultConfig from './defaultconfig.json';
import * as pjson from '../../package.json';
import { threadId } from 'worker_threads';

class Stubr {
	private stubrConfig: Stubr.Config = {};
	private mockServer: Koa = new Koa();
	private mockServerHttp: http.Server | undefined;
	private uiServer: http.Server = http.createServer();
	private io: SocketIO.Server = socketIo();
	private scenarios: Stubr.Scenario[] = [];
	private routeConfigurations: Stubr.RouteConfiguration[] = [];
	private interceptionMarkers: Stubr.RouteInterceptionMarkerAudit[] = [];
	private interceptions: Stubr.RouteInterceptions = {};

	constructor (stubrConfig?: Stubr.Config) {
		this.loadConfiguration(stubrConfig);
		this.initMockServer();
		this.initUiServer();

		this.scenarios = [];
		this.routeConfigurations = [];
		this.interceptionMarkers = [];
		this.interceptions = {};
	}

	private loadConfiguration (stubrConfig?: Stubr.Config) {
		if (stubrConfig) {
			debug('use custom config');
			this.stubrConfig = stubrConfig;
		} else {
			debug('use default config');
			this.stubrConfig = <Stubr.Config>defaultConfig;
		}
	}

	private initMockServer () {
		this.mockServer.use(bodyParser());
	}

	private startMockServer (): Promise<any> {
		return new Promise((resolve, reject) => {
			this.mockServerHttp = http.createServer(this.mockServer.callback());
			this.mockServerHttp.listen(this.stubrConfig.stubsPort, () => {
				logger.info(`started stubr on port: ${this.stubrConfig.stubsPort}`);
				console.log(`started stubr on port: ${this.stubrConfig.stubsPort}`);
				resolve();
			}).on('error', (e) => {
				logger.error('failed starting Stubr: ', e);
				reject(e);
			});
		});
	}

	private stopMockServer (): void {
		this.mockServerHttp ? this.mockServerHttp.close() : null;
	}

	private initUiServer () {
		const app = new Koa();
		const _staticFilesDirectory = path.resolve(__dirname, '../static');
		debug(`serve static files from "${_staticFilesDirectory}"`);
		app.use(koaServe(_staticFilesDirectory));
		this.uiServer = http.createServer(app.callback());
		this.io = socketIo(this.uiServer);
	}

	private stopUiServer (): void {
		this.uiServer ? this.uiServer.close() : null;
	}

	private startUiServer (): Promise<any> {
		return new Promise((resolve, reject) => {
			this.uiServer.listen(this.stubrConfig.uiPort, () => {
				logger.info(`started stubr UI on port: ${this.stubrConfig.uiPort}`);
				console.log(`started stubr UI on port: ${this.stubrConfig.uiPort}`);
				this.bindSocketIoListeners();
				resolve();
			}).on('error', (e) => {
				logger.error('failed starting Stubr UI server: ', e);
				reject(e);
			});
		});
	}

	private bindSocketIoListeners () {
		this.io.on(EventType.CONNECT, (socket: any) => {
			debug('[io] new client connected:', socket.id);

			this.getRouteConfigurationState().forEach((routeConfig: Stubr.RouteConfiguration) => {
				debug(`[io] emit event "${EventType.ROUTE_CONFIG}" with payload:`, routeConfig);
				socket.emit(EventType.ROUTE_CONFIG, routeConfig);
			});

			socket.on(EventType.MARK_ROUTE_FOR_INTERCEPTIONS, (event: Stubr.RouteInterceptionMarker, ack: Function) => {
				debug(`[io] received route interception event from client "${socket.id}":`, event);
				this.setRouteInterceptionMarker(socket.id, event);
				const _foundRouteConfiguration = this.getRouteConfigurationState().find((routeConfiguration: Stubr.RouteConfiguration) => {
					return routeConfiguration.id == event.routeConfigurationId;
				});
				ack(_foundRouteConfiguration); 

				// notify all
				this.io.emit(EventType.ROUTE_CONFIG, _foundRouteConfiguration);
			});

			socket.on(EventType.RESOLVE_INTERCEPTION, (event: Stubr.ResolveInterception) => {
				if (event.logEntryId && event.scenarioId) {
					if (typeof this.interceptions[event.logEntryId] == "function") {
						this.interceptions[event.logEntryId](event.scenarioId);
						debug(`currently intercepted requests: ${Object.keys(this.interceptions) || "none"}`);
					} else {
						debug(`no interception found for logEntryId "${event.logEntryId}"`);
					}
				} else {
					logger.warn(`payload received for ${EventType.RESOLVE_INTERCEPTION} event does not fulfill requirements`);
				}
			});

			socket.on(EventType.DISCONNECT, () => {
				debug('[io] client disconnected:', socket.id);
				this.unsetRouteInterceptionMarkersForSocketId(socket.id);
			});
		});
	}

	// extract covered route configurations from scenarios
	private extractRouteConfigurations(): void {
		const _routeMap: { [route: string]: Method[] }  = {};
		this.scenarios.forEach((scenario: Stubr.Scenario) => {
			if (!_routeMap[scenario.route]) {
				_routeMap[scenario.route] = [scenario.method];
			} else {
				_routeMap[scenario.route] = [..._routeMap[scenario.route], scenario.method]
			}
		});
	
		const _routeConfigurations: Stubr.RouteConfiguration[] = [];
		for (let route in _routeMap) {
			const _methodsArray = _routeMap[route];
	
			const _methodsArrayWithInterceptionState: Array<Stubr.MethodContext> = [];
			_methodsArray.forEach((method: string) => {
				const _foundEntry = _methodsArrayWithInterceptionState.find((entry: any): boolean => {
					return entry.method == method;
				});
				if (!_foundEntry) {
					_methodsArrayWithInterceptionState.push({
						method: method,
						intercepted: false
					});
				}
			});
	
			_routeConfigurations.push({
				id: uuid(),
				route: route,
				methods: _methodsArrayWithInterceptionState
			})
		}
	
		this.routeConfigurations = _routeConfigurations;
	}

	private getRouteConfigurationState(): Stubr.RouteConfiguration[] {
		const _routeConfigurations = cloneDeep(this.routeConfigurations);

		this.interceptionMarkers.forEach((interception: Stubr.RouteInterceptionMarkerAudit): void => {
			_routeConfigurations.find((routeConfiguration: Stubr.RouteConfiguration): boolean => {
				if (routeConfiguration.id == interception.routeConfigurationId) {
					routeConfiguration.methods.forEach((methodContext: Stubr.MethodContext) => {
						if (methodContext.method == interception.method) {
							methodContext.intercepted = interception.intercepted;
						}
					});
					return true;
				}
				return false;
			})
		});

		return _routeConfigurations;
	}

	// filter scenarios by matching route and method
	private getScenarioMatchesForRouteAndMethod (route: string, method: Method): Stubr.Scenario[] {
		return filter(this.scenarios, (scenario) => scenario.route === route && scenario.method === method);
	}

	private isInterceptedForRouteAndMethod (route: string, method: Method): boolean {
		const _foundRouteConfiguration = this.getRouteConfigurationState().find((routeConfiguration: Stubr.RouteConfiguration) => {
			return routeConfiguration.route == route;
		});

		if (_foundRouteConfiguration) {
			return _foundRouteConfiguration.methods.find((methodContext: Stubr.MethodContext) => {
				return methodContext.method == method && methodContext.intercepted == true;
			}) !== undefined;
		}

		return false;
	}

	private setRouteInterceptionMarker (socketId: string, routeInterception: Stubr.RouteInterceptionMarker): void {
		if (routeInterception.intercepted) {
			const _interception: Stubr.RouteInterceptionMarkerAudit | undefined = this.interceptionMarkers.find((interception: Stubr.RouteInterceptionMarkerAudit): boolean => {
				return interception.routeConfigurationId == routeInterception.routeConfigurationId && interception.method == routeInterception.method;
			});

			if (_interception) {
				_interception.socketId = socketId;
			} else {
				this.interceptionMarkers.push({
					routeConfigurationId: routeInterception.routeConfigurationId,
					method: routeInterception.method,
					intercepted: true,
					socketId: socketId
				});
			}
		} else {
			remove(this.interceptionMarkers, (interception: Stubr.RouteInterceptionMarkerAudit) => {
				return interception.routeConfigurationId == routeInterception.routeConfigurationId && interception.method == routeInterception.method;
			});
		}
		debug('route interception markers:', this.interceptionMarkers);
	}

	private unsetRouteInterceptionMarkersForSocketId(socketId: string) {
		remove(this.interceptionMarkers, (interception: Stubr.RouteInterceptionMarkerAudit) => {
			return interception.socketId == socketId;
		});
		debug('route interception markers:', this.interceptionMarkers);

		this.getRouteConfigurationState().forEach((routeConfig: Stubr.RouteConfiguration) => {
			debug(`[io] emit event "${EventType.ROUTE_CONFIG}" with payload:`, routeConfig);
			
			this.io.emit(EventType.ROUTE_CONFIG, routeConfig);
		});
	}

	public register(scenario: Stubr.Scenario): void {
		this.scenarios.push({
			...scenario, 
			id: scenario.id ? scenario.id : uuid() 
		});
	}

	public async run(): Promise<void> {
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

		this.mockServer.use(async (ctx, next) => {
			const _io: SocketIO.Server = this.io;

			function seedResponseWithCase(ctx: any, scenario: Stubr.Scenario, logEntryId?: string): void {
				if (scenario.group) {
					ctx.set('X-Stubr-Case-Group', scenario.group);
				}
				if (scenario.name) {
					ctx.set('X-Stubr-Case-Name', scenario.name);
				}
				if (typeof scenario.responseHeaders == "object") {
					ctx.set(scenario.responseHeaders);
				}

				// if responseBody is a function pass request headers and body
				// to enable dynamic determination of response body
				if (typeof  scenario.responseBody == "function") {
					debug("execute function responseBody() since responseBody was determined to by a function");
					ctx.body = scenario.responseBody(ctx.request.headers, ctx.request.body);
				} else {
					debug("assign responseBody without evaluation");
					ctx.body = scenario.responseBody;
				}
				ctx.status = scenario.responseCode;

				const _logEntry: Stubr.LogEntry = {
					id: logEntryId || uuid(),
					group: scenario.group,
					name: scenario.name,
					route: scenario.route,
					method: scenario.method,
					intercepted: false,
					request: {
						headers: ctx.request.headers,
						body: ctx.request.body
					},
					response: {
						status: ctx.status,
						headers: ctx.response.headers,
						body: ctx.body
					}
				};

				if (!logEntryId && scenario.delay && typeof scenario.delay == "number") {
					_logEntry.delay = scenario.delay;
				}

				debug(`[io] emit event "${EventType.LOG_ENTRY}" with payload:`, _logEntry);
				_io.emit(EventType.LOG_ENTRY, _logEntry);
				logger.info(JSON.stringify(_logEntry));
			}

			const _filteredScenarios: Stubr.Scenario[] = this.getScenarioMatchesForRouteAndMethod(ctx.url, <Method>ctx.method);
	
			if (this.isInterceptedForRouteAndMethod(ctx.url, <Method>ctx.method)) {
				const _logEntry: Stubr.LogEntry = {
					id: uuid(),
					route: ctx.url,
					method: <Method>ctx.method,
					intercepted: true,
					request: {
						headers: ctx.request.headers,
						body: ctx.request.body
					},
					scenarios: _filteredScenarios.map((scenario: Stubr.Scenario): { id: string | undefined, group: string | undefined, name: string } => {
						return {
							id: scenario.id,
							group: scenario.group,
							name: scenario.name
						}
					})
				};

				debug(`[io] emit event "${EventType.LOG_ENTRY}" with payload:`, _logEntry);
				this.io.emit(EventType.LOG_ENTRY, _logEntry);
				logger.info(JSON.stringify(_logEntry));

				await new Promise((resolve) => {
					this.interceptions[_logEntry.id] = (scenarioId: string) => {
						const _selectedScenario: Stubr.Scenario | undefined = _filteredScenarios.find((scenario: Stubr.Scenario): boolean => {
							return scenario.id == scenarioId;
						});

						if (_selectedScenario) {
							seedResponseWithCase(ctx, _selectedScenario, _logEntry.id);
							resolve();
							debug(`resolved interception for request with id "${_logEntry.id}" with scenario with id "${scenarioId}"`);
							delete this.interceptions[_logEntry.id];
						} else {
							logger.error(`could find scenario with id "${scenarioId}" for request with id "${_logEntry.id}" und thus not resolve the request`);
						}
					};
					debug(`currently intercepted requests: ${Object.keys(this.interceptions)}`);
				});
			} else {
				 const _scenarioMatch: Stubr.Scenario | undefined = _filteredScenarios.find((scenario: Stubr.Scenario): boolean => {
					if (typeof scenario.validate == "function") {
						debug(`execute function validate() for scenario with name "${scenario.name}"`);
						const _isValid = scenario.validate(ctx.request.headers, ctx.request.body);
	
						if (_isValid) {
							debug(`found match for scenario with name "${scenario.name}"`);
						}
						return _isValid;
					} else {
						logger.warn(`scenario with name "${scenario.name}" cannot be automatically reached since function validate() is not defined`);
					}
					return false;
				});

				// resolve match
				if (_scenarioMatch) {
					if (_scenarioMatch.delay && typeof _scenarioMatch.delay == "number" ) {
						debug(`waiting for ${_scenarioMatch.delay}ms before resolving request...`);
						await new Promise((resolve) => {
							setTimeout(() => {
								debug(`proceeding with resolving request`);
								resolve();
							}, _scenarioMatch.delay)
						});
					}
					
					if (_scenarioMatch.delay && typeof _scenarioMatch.delay != "number") {
						logger.warn('property delay is only allowed to receive values of type "number"');
					}

					seedResponseWithCase(ctx, _scenarioMatch);
				}
	
				if (_filteredScenarios.length == 0) {
					const _errorMessage = "route not defined";
					ctx.body = { error: _errorMessage };
					ctx.status = 404;
	
					const _logEntry: Stubr.LogEntry = {
						id: uuid(),
						route: ctx.url,
						method: <Method>ctx.method,
						intercepted: false,
						request: {
							headers: ctx.request.headers,
							body: ctx.request.body
						},
						response: {
							status: ctx.status,
							headers: ctx.response.headers,
							body: ctx.body
						},
						error: {
							code: ErrorCode.NO_ROUTE_MATCH,
							message: _errorMessage
						}
					};
	
					debug(`[io] emit event "${EventType.LOG_ENTRY}" with payload:`, _logEntry);
					this.io.emit(EventType.LOG_ENTRY, _logEntry);
					logger.warn(JSON.stringify(_logEntry));
	
					return;
				}
	
				if (!_scenarioMatch && _filteredScenarios.length > 0) {
					const _errorMessage = "no matching scenario found";
					ctx.body = { error: _errorMessage };
					ctx.status = 404;
	
					const _logEntry: Stubr.LogEntry = {
						id: uuid(),
						route: ctx.url,
						method: <Method>ctx.method,
						intercepted: false,
						request: {
							headers: ctx.request.headers,
							body: ctx.request.body
						},
						response: {
							status: ctx.status,
							headers: ctx.response.headers,
							body: ctx.body
						},
						error: {
							code: ErrorCode.NO_SCENARIO_MATCH,
							message: _errorMessage
						}
					};
	
					debug(`[io] emit event "${EventType.LOG_ENTRY}" with payload:`, _logEntry);
					this.io.emit(EventType.LOG_ENTRY, _logEntry);
					logger.warn(JSON.stringify(_logEntry));
				}
			}
		});

		this.extractRouteConfigurations();

		return Promise.all([this.startMockServer(), this.startUiServer()])
			.then(() => {
				logger.info('Stubr is ready to be used.');
				console.log('Stubr is ready to be used.');
			})
			.catch(() => {
				logger.error('failed starting Stubr');
				console.log('failed starting Stubr');
			});
	}

	public stop(): void {
		this.stopUiServer();
		this.stopMockServer();
	}
}

export default Stubr;

export {
	Method
}

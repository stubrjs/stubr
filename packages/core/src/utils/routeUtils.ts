const debug = require('debug')('stubr');
import { cloneDeep, filter, remove } from 'lodash';
import { nanoid } from 'nanoid';
import { Server } from 'socket.io';

import { EventType } from '../@types/enums';

const determineRouteConfigurationState = (
    routeConfigurations: RouteConfiguration[],
    interceptionMarkers: RouteInterceptionMarkerAudit[]
): RouteConfiguration[] => {
    const _routeConfigurations = cloneDeep(routeConfigurations);

    interceptionMarkers.forEach(
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
                                    methodContext.method == interception.method
                                ) {
                                    methodContext.intercepted =
                                        interception.intercepted;
                                }
                            }
                        );
                        return true;
                    }
                    return false;
                }
            );
        }
    );

    return _routeConfigurations;
};

// extract covered route configurations from scenarios
const extractRouteConfigurations = (
    scenarios: Scenario[]
): RouteConfiguration[] => {
    const _routeMap: { [route: string]: Method[] } = {};
    scenarios.forEach((scenario: Scenario) => {
        if (!_routeMap[scenario.route]) {
            _routeMap[scenario.route] = [scenario.method];
        } else {
            _routeMap[scenario.route] = [
                ..._routeMap[scenario.route],
                scenario.method
            ];
        }
    });

    const _routeConfigurations: RouteConfiguration[] = [];
    for (let route in _routeMap) {
        const _methodsArray = _routeMap[route];

        const _methodsArrayWithInterceptionState: Array<MethodContext> = [];
        _methodsArray.forEach((method: string) => {
            const _foundEntry = _methodsArrayWithInterceptionState.find(
                (entry: any): boolean => {
                    return entry.method == method;
                }
            );
            if (!_foundEntry) {
                _methodsArrayWithInterceptionState.push({
                    method: method,
                    intercepted: false
                });
            }
        });

        _routeConfigurations.push({
            id: nanoid(),
            route: route,
            methods: _methodsArrayWithInterceptionState
        });
    }

    return _routeConfigurations;
};

// find a route configuration for a route configuration id
const getRouteConfigurationById = (
    id: string,
    routeConfigurations: RouteConfiguration[]
): RouteConfiguration | undefined => {
    return routeConfigurations?.find(
        (routeConfiguration: RouteConfiguration) => {
            return routeConfiguration.id == id;
        }
    );
};

const extractPathParams = (
    route: string,
    scenario: Scenario
): { [key: string]: string } => {
    if (!route || !scenario) {
        return {};
    }

    const _pathParams: { [key: string]: string } = {};
    const _segmentedScenarioRoute: Array<string> = scenario.route.split('/');
    const _segmentedRequestRoute: Array<string> = route.split('/');

    function isWildcard(segment: string) {
        if (!segment || typeof segment !== 'string') return false;
        return segment.startsWith('{') && segment.endsWith('}');
    }

    _segmentedRequestRoute.forEach((segment, index) => {
        if (isWildcard(_segmentedScenarioRoute[index])) {
            _pathParams[
                _segmentedScenarioRoute[index].substring(
                    1,
                    _segmentedScenarioRoute[index].length - 1
                )
            ] = segment;
        }
    });

    return _pathParams;
};

const isRouteMatch = (
    incomingRoute: string,
    toBeMatchedRoute: string
): boolean => {
    const _segmentedToBeMatchedRoute: Array<String> = toBeMatchedRoute.split(
        '/'
    );
    const _segmentedIncomingRoute: Array<String> = incomingRoute.split('/');

    if (_segmentedToBeMatchedRoute.length !== _segmentedIncomingRoute.length) {
        debug(
            `[route match] incoming route "${incomingRoute}" does not match scenario route "${toBeMatchedRoute}" because of varying route lengths`
        );
        return false;
    }

    let _isMatch: boolean = true;
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
            );
            _isMatch = false;
        }
    });

    debug(
        `[route match] incoming route "${incomingRoute}" matches with scenario route "${toBeMatchedRoute}"`
    );

    return _isMatch;
};

const isInterceptedForRouteAndMethod = (
    route: string,
    method: Method,
    routeConfigurations: RouteConfiguration[]
): boolean => {
    const _foundRouteConfiguration = routeConfigurations.find(
        (routeConfiguration: RouteConfiguration) => {
            return isRouteMatch(route, routeConfiguration.route);
        }
    );

    if (_foundRouteConfiguration) {
        return (
            _foundRouteConfiguration.methods.find(
                (methodContext: MethodContext) => {
                    return (
                        methodContext.method == method &&
                        methodContext.intercepted == true
                    );
                }
            ) !== undefined
        );
    }

    return false;
};

// filter scenarios by matching route and method
const getScenarioMatchesForRouteAndMethod = (
    route: string,
    method: Method,
    scenarios: Scenario[]
): Scenario[] => {
    return filter(scenarios, scenario => {
        if (scenario.method !== method) {
            return false;
        }

        return isRouteMatch(route, scenario.route);
    });
};

// mark a route as intercepted or not intercepted
const setRouteInterceptionMarker = (
    socketId: string,
    routeInterception: RouteInterceptionMarker,
    interceptionMarkers: RouteInterceptionMarkerAudit[]
): void => {
    if (routeInterception.intercepted) {
        const _interception:
            | RouteInterceptionMarkerAudit
            | undefined = interceptionMarkers.find(
            (interception: RouteInterceptionMarkerAudit): boolean => {
                return (
                    interception.routeConfigurationId ==
                        routeInterception.routeConfigurationId &&
                    interception.method == routeInterception.method
                );
            }
        );

        if (_interception) {
            _interception.socketId = socketId;
        } else {
            interceptionMarkers.push({
                routeConfigurationId: routeInterception.routeConfigurationId,
                method: routeInterception.method,
                intercepted: true,
                socketId: socketId
            });
        }
    } else {
        remove(
            interceptionMarkers,
            (interception: RouteInterceptionMarkerAudit) => {
                return (
                    interception.routeConfigurationId ==
                        routeInterception.routeConfigurationId &&
                    interception.method == routeInterception.method
                );
            }
        );
    }
    debug('route interception markers:', interceptionMarkers);
};

const unsetRouteInterceptionMarkersForSocketId = (
    socketId: string,
    routeConfigurations: RouteConfiguration[],
    interceptionMarkers: RouteInterceptionMarkerAudit[],
    ioServer: Server | undefined
): void => {
    remove(
        interceptionMarkers,
        (interception: RouteInterceptionMarkerAudit) => {
            return interception.socketId == socketId;
        }
    );
    debug('route interception markers:', interceptionMarkers);

    routeConfigurations.forEach((routeConfig: RouteConfiguration) => {
        debug(
            `[io] emit event "${EventType.ROUTE_CONFIG}" with payload:`,
            routeConfig
        );

        ioServer?.emit(EventType.ROUTE_CONFIG, routeConfig);
    });
};

export {
    determineRouteConfigurationState,
    extractRouteConfigurations,
    getRouteConfigurationById,
    extractPathParams,
    isRouteMatch,
    isInterceptedForRouteAndMethod,
    getScenarioMatchesForRouteAndMethod,
    setRouteInterceptionMarker,
    unsetRouteInterceptionMarkersForSocketId
};

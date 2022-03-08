import {
    determineRouteConfigurationState,
    extractRouteConfigurations,
    getRouteConfigurationById,
    extractPathParams,
    isRouteMatch,
    isInterceptedForRouteAndMethod,
    getScenarioMatchesForRouteAndMethod,
    //setRouteInterceptionMarker,
    //unsetRouteInterceptionMarkersForSocketId
} from '../../utils/routeUtils';
import { Method } from '../../@types/enums';

test('check route configuration state', () => {
    const interceptionMarkers: RouteInterceptionMarkerAudit[] = [
        {
            routeConfigurationId: 'randomId-1',
            intercepted: true,
            method: Method.POST,
            socketId: 'abcd',
        },
        {
            routeConfigurationId: 'randomId-2',
            intercepted: true,
            method: Method.GET,
            socketId: 'abcd',
        },
        {
            routeConfigurationId: 'randomId-3',
            intercepted: false,
            method: Method.GET,
            socketId: 'abcd',
        },
    ];

    const routeConfigurations: RouteConfiguration[] = [
        {
            id: 'randomId-1',
            methods: [{ method: 'POST', intercepted: false }],
            route: '/route1',
        },
        {
            id: 'randomId-2',
            methods: [
                { method: 'GET', intercepted: false },
                { method: 'POST', intercepted: false },
            ],
            route: '/route2',
        },
        {
            id: 'randomId-3',
            methods: [{ method: 'PUT', intercepted: false }],
            route: '/route3',
        },
    ];

    const determindedRouteConfigurations: RouteConfiguration[] =
        determineRouteConfigurationState(
            routeConfigurations,
            interceptionMarkers
        );

    expect(determindedRouteConfigurations).toMatchObject([
        {
            id: 'randomId-1',
            methods: [
                {
                    intercepted: true,
                    method: 'POST',
                },
            ],
            route: '/route1',
        },
        {
            id: 'randomId-2',
            methods: [
                {
                    method: 'GET',
                    intercepted: true,
                },
                {
                    method: 'POST',
                    intercepted: false,
                },
            ],
            route: '/route2',
        },
        {
            id: 'randomId-3',
            methods: [
                {
                    intercepted: false,
                    method: 'PUT',
                },
            ],
            route: '/route3',
        },
    ]);
});

test('route configurations correctly extracted', () => {
    const scenarios: Scenario[] = [
        {
            name: 'Scenario 1',
            method: Method.GET,
            route: '/my-test/route-1',
            responseCode: 200,
            validate: () => true,
        },
        {
            name: 'Scenario 2',
            method: Method.POST,
            route: '/my-test/route-1',
            responseCode: 200,
            validate: () => true,
        },
        {
            name: 'Scenario 3',
            method: Method.PUT,
            route: '/my-test/route-2',
            responseCode: 200,
            validate: () => false,
        },
    ];

    const extractedRoutes: RouteConfiguration[] =
        extractRouteConfigurations(scenarios);

    expect(extractedRoutes.length).toEqual(2);

    // item 1
    expect(extractedRoutes[0].id.length).toBeGreaterThan(10);
    expect(extractedRoutes[0].route).toEqual('/my-test/route-1');
    expect(extractedRoutes[0].methods).toMatchObject([
        { method: 'GET', intercepted: false },
        { method: 'POST', intercepted: false },
    ]);

    // item 2
    expect(extractedRoutes[1].id.length).toBeGreaterThan(10);
    expect(extractedRoutes[1].route).toEqual('/my-test/route-2');
    expect(extractedRoutes[1].methods).toMatchObject([
        { method: 'PUT', intercepted: false },
    ]);
});

test('get route configuration by ID - found', () => {
    const routeConfigurations: RouteConfiguration[] = [
        {
            id: 'randomId-1',
            methods: [{ method: 'POST', intercepted: false }],
            route: '/route1',
        },
        {
            id: 'randomId-2',
            methods: [{ method: 'GET', intercepted: false }],
            route: '/route2',
        },
    ];

    const config: RouteConfiguration | undefined = getRouteConfigurationById(
        'randomId-1',
        routeConfigurations
    );

    expect(config?.id).toEqual('randomId-1');
    expect(config?.route).toEqual('/route1');
});

test('get route configuration by ID - not found', () => {
    const routeConfigurations: RouteConfiguration[] = [
        {
            id: 'randomId-1',
            methods: [{ method: 'POST', intercepted: false }],
            route: '/route1',
        },
        {
            id: 'randomId-2',
            methods: [{ method: 'GET', intercepted: false }],
            route: '/route2',
        },
    ];

    const config: RouteConfiguration | undefined = getRouteConfigurationById(
        'randomId-3',
        routeConfigurations
    );

    expect(config).not.toBeDefined();
});

test('extract path params from paths', () => {
    const scenario: Scenario = {
        name: 'Scenario 1',
        method: Method.GET,
        route: '/first-segment/{myFirstParam}/another-segment/{mySecondParam}',
        responseCode: 200,
        validate: () => true,
    };

    const pathParams = extractPathParams(
        '/first-segment/first-value/another-segment/second-value',
        scenario
    );

    expect(pathParams).toMatchObject({
        myFirstParam: 'first-value',
        mySecondParam: 'second-value',
    });
});

test('check if two routes match - match w/o path params', () => {
    const isMatch: boolean = isRouteMatch(
        '/first/second/third',
        '/first/second/third'
    );

    expect(isMatch).toBeTruthy();
});

test('check if two routes match - match with path params', () => {
    const isMatch: boolean = isRouteMatch(
        '/first/second/third',
        '/first/{pathParam}/third'
    );

    expect(isMatch).toBeTruthy();
});

test('check if two routes match - no match w/o path params', () => {
    const isMatch: boolean = isRouteMatch(
        '/first/second/third',
        '/first/second2/third'
    );

    expect(isMatch).toBeFalsy();
});

test('check if two routes match - no match with path params', () => {
    const isMatch: boolean = isRouteMatch(
        '/first/second/third2',
        '/first/{pathParam}/third'
    );

    expect(isMatch).toBeFalsy();
});

test('check if route is intercepted - true', () => {
    const routeConfigurations: RouteConfiguration[] = [
        {
            id: 'randomId-1',
            methods: [{ method: 'POST', intercepted: false }],
            route: '/route1',
        },
        {
            id: 'randomId-2',
            methods: [
                { method: 'GET', intercepted: false },
                { method: 'POST', intercepted: true },
            ],
            route: '/route2',
        },
        {
            id: 'randomId-3',
            methods: [{ method: 'PUT', intercepted: false }],
            route: '/route3',
        },
    ];

    const isIntercepted: boolean = isInterceptedForRouteAndMethod(
        '/route2',
        Method.POST,
        routeConfigurations
    );

    expect(isIntercepted).toBeTruthy();
});

test('check if route is intercepted - false', () => {
    const routeConfigurations: RouteConfiguration[] = [
        {
            id: 'randomId-1',
            methods: [{ method: 'POST', intercepted: false }],
            route: '/route1',
        },
        {
            id: 'randomId-2',
            methods: [
                { method: 'GET', intercepted: false },
                { method: 'POST', intercepted: true },
            ],
            route: '/route2',
        },
        {
            id: 'randomId-3',
            methods: [{ method: 'PUT', intercepted: false }],
            route: '/route3',
        },
    ];

    const isIntercepted: boolean = isInterceptedForRouteAndMethod(
        '/route3',
        Method.PUT,
        routeConfigurations
    );

    expect(isIntercepted).toBeFalsy();
});

test('determine scenario matches for route and method', () => {
    const scenarios: Scenario[] = [
        {
            name: 'Scenario 1',
            method: Method.GET,
            route: '/my-test/route-1',
            responseCode: 200,
            validate: () => true,
        },
        {
            name: 'Scenario 2',
            method: Method.POST,
            route: '/my-test/route-1',
            responseCode: 200,
            validate: () => true,
        },
        {
            name: 'Scenario 3',
            method: Method.PUT,
            route: '/my-test/route-2',
            responseCode: 200,
            validate: () => false,
        },
    ];

    const scenarioMatches: Scenario[] = getScenarioMatchesForRouteAndMethod(
        '/my-test/route-1',
        Method.POST,
        scenarios
    );

    expect(scenarioMatches).toHaveLength(1);
    expect(scenarioMatches[0].name).toEqual('Scenario 2');
});

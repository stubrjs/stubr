type IncomingHttpHeaders = import('http').IncomingHttpHeaders;
type OutgoingHttpHeaders = import('http').OutgoingHttpHeaders;

type Method = import('./enums').Method;
type ErrorCode = import('./enums').ErrorCode;

interface IStubr {
    register(scenario: {
        id?: string;
        name: string;
        route: string;
        method: Method;
        group?: string;
        delay?: number;
        validate?:
            | boolean
            | ((headers: object, body: object, params: object) => boolean);
        responseCode: number;
        responseHeaders?:
            | { [key: string]: string }
            | ((headers: object, body: object, params: object) => object);
        responseFilePath?: string;
        responseBody?:
            | object
            | ((headers: object, body: object, params: object) => any);
    }): void;

    run(): void;
}

interface Config {
    stubsPort?: number;
    uiPort?: number;
    corsEnabled?: boolean;
    corsAllowOrigin?: string;
    swaggerSpecs?: {
        specPaths: string[];
        strictMode?: boolean;
    };
}

interface Scenario {
    id?: string;
    name: string;
    route: string;
    method: Method;
    group?: string;
    delay?: number;
    validate?:
        | boolean
        | ((headers: object, body: object, params: object) => boolean);
    responseCode: number;
    responseHeaders?:
        | { [key: string]: string }
        | ((
              headers: { [key: string]: string },
              body: any,
              params: { [key: string]: string | string[] }
          ) => object);
    responseFilePath?: string;
    responseBody?:
        | object
        | ((
              headers: { [key: string]: string },
              body: any,
              params: { [key: string]: string | string[] }
          ) => any);
}

interface LogEntry {
    id: string;
    group?: string;
    name?: string;
    route: string;
    method: Method;
    intercepted: boolean;
    delay?: number;
    request: {
        headers: IncomingHttpHeaders;
        body: object;
        params: object;
    };
    response?: {
        status: number;
        headers: OutgoingHttpHeaders;
        hasSentFile: boolean;
        body: object;
    };
    scenarios?: Array<{
        id: string | undefined;
        group: string | undefined;
        name: string;
    }>;
    error?: {
        code: ErrorCode;
        message: string;
    };
}

interface MethodContext {
    method: string;
    intercepted: boolean;
}

interface RouteConfiguration {
    id: string;
    route: string;
    methods: Array<MethodContext>;
}

interface RouteInterceptionMarker {
    routeConfigurationId: string;
    method: Method;
    intercepted: boolean;
}

interface RouteInterceptionMarkerAudit extends RouteInterceptionMarker {
    socketId: string;
}

interface RouteInterceptions {
    [logEntryId: string]: (scenarioId: string) => void;
}

interface ResolveInterception {
    logEntryId: string;
    scenarioId: string;
}

import { Method, ErrorCode } from './enums';

interface MethodContext {
    method: string;
    intercepted: boolean;
}

interface RouteConfiguration {
    id: string;
    route: string;
    methods: Array<MethodContext>;
}

interface LogEntryRemote {
    id: string;
    group?: string;
    name?: string;
    route: string;
    method: Method;
    intercepted: boolean;
    delay?: number;
    request: {
        headers: { [key: string]: string };
        body: object;
        params: object;
    };
    response?: {
        status: number;
        headers: { [key: string]: string };
        hasSentFile: boolean;
        body: object;
    };
    scenarios?: Array<{
        id: string | undefined;
        group: string | undefined;
        name: string;
    }>;
    error?: { code: ErrorCode; message: string };
}

interface LogEntryLocal extends LogEntryRemote {
    timestamp: Date;
}

interface LogEntriesPerRoute {
    [route: string]: number;
}

interface HiddenLogEntriesMarker {
    startIndex: number;
    afterLogEntryId: string;
    noOfHiddenItems: number;
}

interface HiddenLogEntriesMarkerMap {
    [afterLogEntryId: number]: HiddenLogEntriesMarker;
}

interface RouteInterception {
    routeConfigurationId: string;
    method: Method;
    intercept: boolean;
}

interface ResolveInterception {
    logEntryId: string;
    scenarioId: string;
}

interface EnabledRouteFilters {
    [route: string]: boolean;
}

export enum Method {
    OPTIONS = 'OPTIONS',
    HEAD = 'HEAD',
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
}

export enum EventType {
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    LOG_ENTRY = 'LOG_ENTRY',
    ROUTE_CONFIG = 'ROUTE_CONFIG',
    MARK_ROUTE_FOR_INTERCEPTIONS = 'MARK_ROUTE_FOR_INTERCEPTIONS',
    RESOLVE_INTERCEPTION = 'RESOLVE_INTERCEPTION',
}

export enum ErrorCode {
    NO_ROUTE_MATCH = 'NO_ROUTE_MATCH',
    NO_SCENARIO_MATCH = 'NO_SCENARIO_MATCH',
}

import { Method, ErrorCode } from "./enums";
import { Stubr } from "./main";

declare module Stubr {
    export interface Config {
        stubsPort?: number;
        uiPort?: number;
    }
    
    interface Scenario {
        id?: string;
        name: string;
        route: string;
        method: Method;
        group?: string;
        delay?: number;
        validate: (headers: object, body: object) => boolean;
        responseCode: number;
        responseHeaders?: { [key: string]: string };
        responseBody?: object;
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
            headers: { [key: string]: string };
            body: object;
        }
        response?: {
            status: number;
            headers: { [key: string]: string };
            body: object;
        }
        scenarios?: Array<{
            id: string | undefined;
            group: string | undefined;
            name: string;
        }>;
        error?: { 
            code: ErrorCode;
            message: string;
        }
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
        [logEntryId: string]: (scenarioId: string) => void
    }
    
    interface ResolveInterception {
        logEntryId: string,
        scenarioId: string
    }
}

export as namespace Stubr;
export = Stubr;
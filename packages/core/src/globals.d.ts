declare class Stubr {
    constructor(config?: {
        stubsPort?: number;
        uiPort?: number;
        corsEnabled?: boolean;
        corsAllowOrigin?: string;
    });

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
            | ((
                  headers: object,
                  body: object,
                  params: object
              ) => { [key: string]: string });
        responseFilePath?: string;
        responseBody?:
            | object
            | ((headers: object, body: object, params: object) => any);
    }): void;

    run(): void;
}

export default Stubr;

export as namespace Stubr;

export enum Method {
    OPTIONS = 'OPTIONS',
    HEAD = 'HEAD',
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
}

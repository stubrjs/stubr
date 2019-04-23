declare class Stubr {
    register(scenario: {
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
    }): void

    run(): Promise<void>

    stop(): void
}

export default Stubr;

export as namespace Stubr;

export enum Method {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	PATCH = "PATCH",
	DELETE = "DELETE"
}

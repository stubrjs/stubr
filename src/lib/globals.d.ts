declare class Stubr {
    constructor(config?: object);

    register(scenario: {
        id?: string;
        name: string;
        route: string;
        method: Method;
        group?: string;
        delay?: number;
        validate: (headers: object, body: object, params: object) => boolean;
        responseCode: number;
	    responseHeaders?: { [key: string]: string } | ((headers: object, body: object, params: object) => object);
	    responseFilePath?: string;
	    responseBody?: object | ((headers: object, body: object, params: object) => any);
    })

    run(): void
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

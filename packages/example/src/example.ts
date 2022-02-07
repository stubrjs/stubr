import Stubr from 'stubr';
import { Method } from 'stubr';

const stubr = new Stubr();

stubr.register({
	group: "MyGroup",
	name: "Test Post",
	route: "/test-post",
	method: Method.POST,
	delay: 500,
	validate: (headers: object, body: object) => {
		return true;
	},
	responseCode: 200,
	responseBody: {
		data: "test"
	}
});

stubr.register({
	group: "MyGroup",
	name: "Test Get",
	route: "/test-get",
	method: Method.GET,
	validate: (headers: object, body: object) => {
		return true;
	},
	responseCode: 200,
	responseBody: (headers: object, body: object) => {
		return {
			...body,
			data: "yay, dynamic body"
		}
	}
});

stubr.register({
	group: "MyGroup",
	name: "Test Put",
	route: "/test-get",
	method: Method.PUT,
	validate: (headers: object, body: object) => {
		return true;
	},
	responseCode: 200,
	responseBody: (headers: object, body: object) => {
		return {
			...body,
			data: "yay, dynamic body"
		}
	}
});

stubr.register({
	group: "MyGroup",
	name: "Test Patch",
	route: "/test-patch",
	method: Method.PATCH,
	validate: (headers: object, body: object) => {
		return true;
	},
	responseCode: 200,
	responseBody: (headers: object, body: object) => {
		return {
			...body,
			data: "yay, dynamic body"
		}
	}
});

// example for dynamic headers, route params and query params
stubr.register({
	group: "MyGroup",
	name: "Test with Params",
	route: "/{dynamic}/route-with-params",
	method: Method.GET,
	validate: (headers: object, body: object, params: object) => {
		return params && (params as any).test;
	},
	responseCode: 200,
	responseHeaders: (headers: object, body: object, params: object) => {
		return {
			"X-Test": (params as any).test
		}
	},
	responseBody: (headers: object, body: object, params: object) => {
		return {
			...body,
			data: "yay, dynamic body",
			params: params
		}
	}
});

// example for non json content types
stubr.register({
	group: "MyGroup",
	name: "Test HTML body",
	route: "/html-response",
	method: Method.GET,
	validate: (headers: object, body: object, params: object) => {
		return true;
	},
	responseCode: 200,
	responseBody: (headers: object, body: object, params: object) => {
		return `
<html>
	<head></head>
	<body>
		<p>Hello World</p>
	</body>
</html>
		`
	}
});

// example for non json content types
stubr.register({
	group: "MyGroup",
	name: "Get File",
	route: "/get-file",
	method: Method.GET,
	validate: (headers: object, body: object, params: object) => {
		return true;
	},
	responseCode: 200,
	responseFilePath: "dummy.pdf"
});

stubr.run();

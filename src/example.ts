import Stubr from './lib/main';
import { Method } from './lib/main';

const stubr = new Stubr();

stubr.register({
	group: "MyGroup",
	name: "Test",
	route: "/abc",
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
	name: "Test 2",
	route: "/abcd",
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
	name: "Test with Params",
	route: "/route-with-params",
	method: Method.GET,
	validate: (headers: object, body: object, params: object) => {
		return params && (params as any).test === "1234";
	},
	responseCode: 200,
	responseBody: (headers: object, body: object) => {
		return {
			...body,
			data: "yay, dynamic body"
		}
	}
});

stubr.run();

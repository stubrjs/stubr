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
	name: "Test 6",
	route: "/abcd",
	method: Method.GET,
	validate: (headers: object, body: object) => {
		return true;
	},
	responseCode: 200,
	responseBody: (headers: object, body: object) => {
		return {
			...body,
			data: "yay, dynamic body 2"
		}
	}
});

stubr.run();

import Stubr from './main';
import { Method } from './main';
import axios from 'axios';

let stubr;

describe('Stubr REST API', () => {
    beforeAll(() => {
        stubr = new Stubr();

        stubr.register({
            name: "get success case",
            route: "/get/200",
            method: Method.GET,
            validate: (headers: object, body: object) => {
                return true;
            },
            responseCode: 200,
            responseBody: {
                data: "foo"
            }
        });

        stubr.register({
            name: "get success case 2",
            route: "/get/200",
            method: Method.GET,
            validate: (headers: object, body: object) => {
                return true;
            },
            responseCode: 200,
            responseBody: {
                data: "foo 2"
            }
        });

        stubr.register({
            group: "my group",
            name: "get success case with group",
            route: "/get/200/group",
            method: Method.GET,
            validate: (headers: object, body: object) => {
                return true;
            },
            responseCode: 200,
            responseBody: {
                data: "foo"
            }
        });

        stubr.register({
            name: "no match",
            route: "/no-match",
            method: Method.GET,
            validate: (headers: object, body: object) => {
                return false;
            },
            responseCode: 200,
            responseBody: {
                data: "foo"
            }
        });

        stubr.run();
    });

    afterAll(() => {
        stubr.stop();
    });
    
    it('case match success validation true', async () => {
        await axios.get('http://localhost:4000/get/200')
            .then(function (response) {
                expect(response.status).toEqual(200);
                expect(response.data).toEqual({data: "foo"});
                expect(response.headers['x-stubr-case-name']).toEqual('get success case');
                expect(response.headers['x-stubr-case-group']).toBeUndefined;
            });
    });

    it('group name exposed as header', async () => {
        await axios.get('http://localhost:4000/get/200/group')
            .then(function (response) {
                expect(response.headers['x-stubr-case-name']).toEqual('get success case with group');
                expect(response.headers['x-stubr-case-group']).toEqual('my group');
            });
    });

    it('route not defined returns correct error', async () => {
        await axios.get('http://localhost:4000/does-not-exist')
            .catch(function (error) {
                expect(error.response.status).toEqual(404);
                expect(error.response.data).toEqual({error: "route not defined"});
                expect(error.response.headers['x-stubr-case-name']).toBeUndefined;
                expect(error.response.headers['x-stubr-case-group']).toBeUndefined;
            });
    });

    it('scenario nonmatch returns correct error', async () => {
        await axios.get('http://localhost:4000/no-match')
            .catch(function (error) {
                expect(error.response.status).toEqual(404);
                expect(error.response.data).toEqual({error: "no matching scenario found"});
                expect(error.response.headers['x-stubr-case-name']).toBeUndefined;
                expect(error.response.headers['x-stubr-case-group']).toBeUndefined;
            });
    });
});
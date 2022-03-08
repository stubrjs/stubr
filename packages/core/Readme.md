<img src="./docs/logo-large.png"/>

<p align="center">
  <a href="https://www.npmjs.com/package/stubr"><img src="https://img.shields.io/npm/v/stubr.svg?sanitize=true" alt="Version"></a>
  <a href="https://www.npmjs.com/package/stubr"><img src="https://img.shields.io/npm/l/stubr.svg?sanitize=true" alt="License"></a>
</p>

A flexibile mock server to stub third party APIs. Stubr can answer API requests based on configured scenarios. These can be resolved automatically based on validation functions as well as manually via request interceptions. On top it optionally exposes a UI to monitor requests giving insights into request and response headers and bodies, determined scenarios and gives control over manual scenario resolution.

## Installation

```
$ npm install stubr
```

## Getting started

### Typescript example

Stubr is written in Typescript and thus has built in Typescript support for its usage, too.

```ts
import Stubr from 'stubr';
import { Method } from 'stubr';

// instantiate Stubr
const stubr = new Stubr();

// register first scenario
stubr.register({
    name: 'Scenario 1',
    route: '/my/first/route',
    method: Method.GET,
    validate: (
        requestHeaders: object,
        requestBody: object,
        requestParams: object
    ) => {
        return true;
    },
    responseCode: 200,
    responseBody: {
        data: 'my first response',
    },
});

// start Stubr
stubr.run();
```

### Javascript example

```js
const Stubr = require('stubr').default;
const { Method } = require('stubr');

// instantiate Stubr
const stubr = new Stubr();

// register first scenario
stubr.register({
    name: 'Scenario 1',
    route: '/my/first/route',
    method: Method.GET,
    validate: (requestHeaders, requestBody, requestParams) => {
        return true;
    },
    responseCode: 200,
    responseBody: {
        data: 'my first response',
    },
});

// start Stubr
stubr.run();
```

## Instantiate, register, run

The usage of Stubr starts with creation of a new instance. Optionally, you can pass a runtime configuration. Otherwise, Stubr would start using its default configuration.

```js
new Stubr({
    stubsPort: 4000, // default value: 4000
    uiPort: 3000, // default value: 3000
});
```

On that you can register as many scenarios as you like by passing a [scenario](#Scenario) object to the `stubr.register()` function. In order to register more than one scenario, call `stubr.register()` multiple times. Each time with a single scenario.

```js
stubr.register({
	...
});

stubr.register({
	...
});
```

Finally, the server gets started via executing the `run()` function.

## Scenarios

Below an example using all options you could pass to a scenario.

```js
stubr.register({
	// scenarios can be grouped (optional)
	group: "My Group",
	// required
	name: "Scenario 1",
	// required
	route: "/my/first/{dynamic}/route",
	// GET, POST, PUT, DELETE
	method: Method.GET,
	// delay response (optional)
	delay: 2000,
	// headers and body passed to provide context for validation
	validate: (requestHeaders, requestBody, requestParams) => {
		return true;
	},
	responseCode: 200,
	// optionally you can receive headers and body to construct dynamic response headers based on request
	responseHeaders: (requestHeaders, requestBody, requestParams) => {
		"X-My-Header-Attribute": "abc"
	},
	// optionally you can reference a file to be sent as response
	responseFilePath: "./example.pdf",
	// optionally you can receive headers and body to construct dynamic response body based on request
	responseBody: (requestHeaders, requestBody, requestParams) => {
		data: "my first response"
	}
});
```

The `validate: (requestHeaders, requestBody, requestParams) => boolean` function shall be used to determine the matching scenario. Headers, query params and body of request can be used to determine whether the scenario is matched or not. If the function returns `true` the scenario is considered to be matched and thus used to resolve the response.

The combination of `route` and `method` determines which scenarios are selected for evaluation. Since requests can only be answered with one response at a time, the first scenario match wins to be selected for response (even though multiple scenarios are evaluated to be tue). Routes can also have wildcards. Path segments being wrapped with curly brackets are treated as wildcards and their keys and values get injected to `params` attribute, which can be used in validation functions, dynamic response headers and dynamic response body.

`group` can help structuring scenarios, but is optional.

`delay` can can be set to delay the response by x ms. Since requests to Stubr are usually answered within a few milliseconds, this attribute can optionally be used to match the expected performance of stubed APIs more realistically.

The `responseHeaders` attribute can either be a static response object or optionally receive a function `responseHeaders: (requestHeaders, requestBody, requestParams) => object` to dynamically construct the response headers object based on request. In case of request body being XML, it is made available as JSON structure for POST, PUT and PATCH as method.

The `responseFilePath` attribute defines the path to a static file to be exposed as response. The path needs to be a string and is interpreted relative to the script file, which defines the `register()` function. The file type of referenced file is being used to auto populate the `Content-Type` response header. If `responseFilePath` is specified, then a potentially additionally defined `responseBody` would be ignored.

The `responseBody` attribute can either be a static response object or optionally receive a function `responseBody: (requestHeaders, requestBody, requestParams) => object` to dynamically construct the response body based on request. In case of request body being XML, it is made available as JSON structure for POST, PUT and PATCH as method.

## Monitoring, UI

Stubr comes with a UI, that enables monitoring incoming requests with request headers and body as well as the automatically determined scenario and respective response headers, query params and body.

Moreover, by scenarios covered routes are grouped and can be chosen to get intercepted via UI. Doing so would prevent respective routes from being answered automatically. Instead, the user gets presented with all registered scenarios for the intercepted route / method combination and can decide on which scenario should be used to answer the request manually.

## License

Stubr is licensed under the MIT license.

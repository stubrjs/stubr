<img src="./docs/logo-large.png"/>

[![CircleCI](https://circleci.com/gh/stubrjs/stubr/tree/master.svg?style=shield)](https://circleci.com/gh/stubrjs/stubr/tree/master)
[![Dependencies badge](https://david-dm.org/stubrjs/stubr.svg)](https://david-dm.org/stubrjs/stubr)
[![Greenkeeper badge](https://badges.greenkeeper.io/stubrjs/stubr.svg)](https://greenkeeper.io/)
[![codecov](https://codecov.io/gh/stubrjs/stubr/branch/master/graph/badge.svg)](https://codecov.io/gh/stubrjs/stubr)

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
	name: "Scenario 1",
	route: "/my/first/route",
	method: Method.GET,
	validate: (requestHeaders: object, requestBody: object) => {
		return true;
	},
	responseCode: 200,
	responseBody: {
		data: "my first response"
	}
});

// start Stubr
stubr.run();
```

### Javascript example
```js
const Stubr = require("stubr").default;
const { Method } = require("stubr");

// instantiate Stubr
const stubr = new Stubr();

// register first scenario
stubr.register({
	name: "Scenario 1",
	route: "/my/first/route",
	method: Method.GET,
	validate: (requestHeaders, requestBody) => {
		return true;
	},
	responseCode: 200,
	responseBody: {
		data: "my first response"
	}
});

// start Stubr
stubr.run();
```

## Instantiate, register, run
The usage of Stubr starts with creation of a new instance. Optionally, you can pass a runtime configuration. Otherwise, Stubr would start using its default configuration.

```js
new Stubr({
    "stubsPort": 4000,  // default value: 4000
    "uiPort": 3000      // default value: 3000
});
```

On that you can register as many scenarios as you like passing a [scenario](#Scenario) object. Finally, the sever

## Scenarios
Below an example using all options you could pass to a scenario.
```js
stubr.register({
    group: "My Group", // scenarios can be grouped (optional)
	name: "Scenario 1", // required
	route: "/my/first/route", // required
    method: Method.GET, // GET, POST, PUT, PATCH
    delay: 2000, // delay response (optional)
    // headers and body passed to provide context for validation
	validate: (requestHeaders, requestBody) => {
		return true;
	},
    responseCode: 200,
    // optionally you can receive headers and body to construct dynamic response based on request
	responseBody: (requestHeaders, requestBody) => {
		data: "my first response"
	}
});
```
The `validate: (requestHeaders, requestBody) => boolean` function shall be used to determine the matching scenario. Headers and body of request can be used to determine whether the scenario is matched or not. If the function returns `true` the scenario is considered to be matched and thus used to resolve the response. 

The combination of `route` and `method` determines which scenarios are selected for evaluation. Since requests can only be answered with one response at a time, the first scenario match wins to be selected for response (even though multiple scenarios are evaluated to be tue).

`group` can help structuring scenarios, but is optional.

`delay` can can be set to delay the response by x ms. Since requests to Stubr are usually answered within a few milliseconds, this attribute can optionally be used to match the expected performance of stubed APIs more realistically.

The `responseBody` attribute can either be a static response object or optionally receive a function `responseBody: (requestHeaders, requestBody) => object` to dynamically construct the response object based on request.

## License
MIT
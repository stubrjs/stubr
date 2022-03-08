<img src="./docs/logo-large.png"/>

<p align="center">
  <a href="https://www.npmjs.com/package/stubr"><img src="https://img.shields.io/npm/v/stubr.svg?sanitize=true" alt="Version"></a>
  <a href="https://www.npmjs.com/package/stubr"><img src="https://img.shields.io/npm/l/stubr.svg?sanitize=true" alt="License"></a>
</p>

## What is Stubr?

Stubr is a flexibile mock server to stub third party APIs. It can answer API requests based on configured scenarios. Stubr is especially helpful during the development and testing of client applications, that rely on API integrations with services that may...

-   be under development themselves
-   don't expose the test data you need
-   are hard to be put into states that are required to implement and test certain frontend states (e.g. loading behaviour and response to edge cases like service outage)

Stubr allows for incoming request can be...

-   resolved automatically based on scenario validation functions
-   resolved manually via request interceptions
-   observed via Stubr's monitoring UI

## Installation

```
$ npm install stubr
```

or

```
$ yarn add stubr
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

## How to move on?

Please follow our [documentation](https://stubr.readme.io/docs) for full reference and more examples.

## License

Stubr is licensed under the MIT license.

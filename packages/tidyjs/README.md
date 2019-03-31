# `tidyjs`
> A Node.js framework born for more tidy development of building server-side applications on top of Node.js & Typescript.

## Installation
```bash
$ npm install tidyjs --save
```
Node.js >= 8.0.0 required

## Getting Started
```js
import { tidyServerApp } from 'tidyjs'

tidyServerApp()
    .use(ctx => {
        return {
           message: `Hello ${ctx.req.query.my_name || 'world'}, I am tidyjs`,
        }
    })
    .listen(3000)
```

## Features
- **Extensible** : powerful and simple plugin system
- **Developer friendly** : full Typescript support, and built to be very expressive.
- **Clean business logic** : use pure function, separated from web protocol
- **Full async support** : take advantage of the new async/await syntax
- **Routing support type and schema** : we can easily build strongly typed interfaces.
- **High performance routing** : use used Prefix Tree, when there are a lot of routes, lookup performance can be greatly improved
- **Clean and solid code** : with type Typescript strict mode, and async/await catch all errors and exceptions

## Docs
- [Tidy Family](https://github.com/guopi/tidy/wiki)
- [Overview](https://github.com/guopi/tidy/wiki/tidyjs)
- [Plugins](https://github.com/guopi/tidy/wiki/tidy-plugins)
- [Router](https://github.com/guopi/tidy/wiki/tidy-router)
- [Logging](https://github.com/guopi/tidy/wiki/tidyjs-Logging)
    
## [Examples]
[code on github](https://github.com/guopi/tidy/tree/master/packages/tidy-examples)

## License
[MIT]


[MIT]: https://github.com/guopi/tidy/blob/master/LICENSE

[tidy-router]: https://github.com/guopi/tidy/tree/master/packages/tidy-router
[tidy-router-version]: https://img.shields.io/npm/v/tidy-router.svg
[tidy-router-npm]: https://www.npmjs.com/package/tidy-router

[tidy-cookie]: https://github.com/guopi/tidy/tree/master/packages/tidy-cookie
[tidy-cookie-version]: https://img.shields.io/npm/v/tidy-cookie.svg
[tidy-cookie-npm]: https://www.npmjs.com/package/tidy-cookie

[tidy-upload]: https://github.com/guopi/tidy/tree/master/packages/tidy-upload
[tidy-upload-version]: https://img.shields.io/npm/v/tidy-upload.svg
[tidy-upload-npm]: https://www.npmjs.com/package/tidy-upload

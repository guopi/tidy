# `tidyjs`
Born for more tidy development of building server-side applications on top of Node.js & Typescript.

## Features
- **Developer friendly** : full Typescript support
- **Separation of business logic and web protocol** :
- **Full async support** : 
- **Routing support type and schema** : 
- **Extensible** : plugin system
- **High performance** : routing use used Prefix Tree
- **Logging**: we choose [Pino](https://github.com/pinojs/pino), a very low overhead logger
- **Clean and solid code style** : 
    type safe & error

## Installation
```bash
$ npm install tidyjs --save
```
Node.js >= 8.0.0 required

## Getting Started
```js
import { TidyServerApp } from 'tidyjs'

new TidyServerApp()
    .use(ctx => {
        return {
           message: `Hello ${ctx.req.query.my_name || 'world'}, I am tidyjs`,
        }
    })
    .listen(3000)
```
Node.js >= 8.0.0 required.

## [Docs](https://github.com/guopi/tidy/wiki)
## [Examples](https://github.com/guopi/tidy/tree/master/packages/tidy-examples)
## License
[MIT]


[MIT]: https://github.com/guopi/tidy/blob/master/LICENSE

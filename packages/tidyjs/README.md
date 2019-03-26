# `tidyjs`
Born for more tidy development of building server-side applications on top of Node.js & Typescript.

## Features
- Developer friendly
    Typescript
- Separation of business logic and web protocol
- full async
- full Typescript support
- type safe & error
- routing support type and schema 
- Extensible:
    processor system
- High performance
    routing use used Prefix Tree
- Logging: we choose [Pino](https://github.com/pinojs/pino), a very low overhead logger
- Clean and solid code style
    type safe & error

## Installation
```bash
$ npm install tidyjs --save
```
Node.js >= 8.0.0 required

## Getting Started
```js
import { TidyServerApp } from 'tidyjs'

const app = new TidyServerApp()
app.use(ctx => {
    return {
       message: `Hello ${input.query.my_name || 'world'}, I am tidyjs`,
    }
})
app.listen(3000)

```
Node.js >= 8.0.0 required.

## Docs

## Examples
See [tidy-examples]

## License
[MIT]

[MIT]: https://github.com/guopi/tidy/blob/master/LICENSE
[tidy-examples]: https://github.com/guopi/tidy/tree/master/packages/tidy-examples

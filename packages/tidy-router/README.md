# `tidy-router`

> tidy router used tidy-path-tree

## Installation
```bash
$ npm install tidy-router --save
```

## Usage

```typescript
// for typescript

import { tidyBodyParser, tidyServerApp } from 'tidyjs'
import { TidyRouter } from 'tidy-router'
import { tjs } from 'tidy-json-schema'

const router = new TidyRouter<any>()
    .on('GET', '/test/:name/:value', ctx => {
        return {
            req: ctx.req
        }
    })
    .on({
            req: tjs.obj({
                params: tjs.obj({
                    ver: tjs.str(),
                    count: tjs.int().max(100),
                })
            })
        },
        'GET', '/test2/:ver/:count', ctx => {
            return {
                req: ctx.req
            }
        })
    .on<{
        req: {
            body: {
                a: string,
                b?: number
            }
        }
        resp: {
            body: {
                c: string
            }
        }
    }>('POST', '/test3', ctx => {
        return {
            c: ctx.req.body.a + ctx.req.body.b || '0'
        }
    })

tidyServerApp()
    .use(tidyBodyParser())
    .use(router)
    .listen(3000)
```


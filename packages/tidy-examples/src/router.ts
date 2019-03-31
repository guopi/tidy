import { tidyBodyParser, tidyServerApp } from 'tidyjs'
import { tidyRouter } from 'tidy-router'
import { tjs } from 'tidy-json-schema'

const router = tidyRouter<any>()
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

console.log(`router example started. test command:
\thttp get :3000/test/tidy/value1
\thttp get :3000/test2/tidy/99
\thttp -v post :3000/test3 a=string_a b=123
`)

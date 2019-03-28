import { TidyServerApp } from 'tidyjs'
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

new TidyServerApp()
    .use(router)
    .listen(3000)

console.log(`router example started. test command:
\thttp get :3000/test/tidy/value1
`)

import { TidyServerApp } from 'tidyjs'
import { TidyRouter } from 'tidy-router'

const router = new TidyRouter<any>()
    .on('GET', '/test/:name/:value', ctx => {
        return {
            params: ctx.req.params
        }
    })

new TidyServerApp()
    .use(router)
    .listen(3000)

console.log(`router example started. test command:
\thttp get :3000/test/tidy/value1
`)

import { JsonResult, tidyQueryStringParser, TidyServerApp } from 'tidyjs'

new TidyServerApp()
    .use(tidyQueryStringParser())
    .use(ctx => {
        return new JsonResult<any>({
            req: ctx.req
        })
    })
    .listen(3000)

console.log(`body-parser example started. test command:
\thttp get :3000/test/123 field1==value1 field2.x==value2X field3.y==value3Y
`)

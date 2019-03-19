import { JsonResult, tidyQueryStringParser, TidyServerApp } from 'tidyjs'

new TidyServerApp()
    .use(tidyQueryStringParser())
    .use(ctx => {
        const { _origin, ...req } = ctx.req
        return new JsonResult<any>({
            req: req
        })
    })
    .listen(3000)

console.log(`body-parser example started. test command:
\thttp get :3000/test/123 field1==value1 field2.x==value2X field3.y==value3Y
`)

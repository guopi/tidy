import { JsonResult, tidyBodyParser, TidyServerApp } from 'tidyjs'

new TidyServerApp()
    .use(tidyBodyParser())
    .use(ctx => {
        const { _origin, ...req } = ctx.req
        return new JsonResult<any>({
            req: req
        })
    })
    .listen(3000)

console.log(`body-parser example started. test command:
\thttp -v --form post :3000/test/123 field1=value1 field2.x=value2X
\thttp -v post :3000/test/123 field1=value1 field2=value2X
`)

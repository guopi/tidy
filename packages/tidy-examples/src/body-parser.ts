import { JsonResult, tidyBodyParser, tidyServerApp } from 'tidyjs'

tidyServerApp()
    .use(tidyBodyParser())
    .use(ctx => {
        return new JsonResult<any>({
            req: ctx.req
        })
    })
    .listen(3000)

console.log(`body-parser example started. test command:
\thttp -v --form post :3000/test/123 field1=value1 field2.x=value2X
\thttp -v post :3000/test/123 field1=value1 field2=value2X
`)

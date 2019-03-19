import { JsonResult, TidyServerApp } from 'tidyjs'
import { cookieParser } from 'tidy-cookie'

new TidyServerApp()
    .use(cookieParser())
    .use(ctx => {
        return new JsonResult<any>({
            cookies: ctx.req.cookies
        })
    })
    .listen(3000)

console.log(`cookie example started. test command:
\thttp post :3000/test/123 'Cookie:cookie1=value1;cookie2=value2'
`)

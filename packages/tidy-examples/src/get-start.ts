import { JsonResult, TidyServerApp } from 'tidyjs'

new TidyServerApp()
    .use(ctx => {
        return new JsonResult<any>({
            method: ctx.method,
            url: ctx.url,
            headers: ctx.headers,
            httpVersion: ctx.httpVersion,
        })
    })
    .listen(3000)

console.log(`get-start example started. test command:
\thttp post :3000/test/123
`)


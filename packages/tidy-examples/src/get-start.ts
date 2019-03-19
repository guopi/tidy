import { ErrorResult, JsonResult, TidyServerApp } from 'tidyjs'

const app = new TidyServerApp()

app.use(ctx => {
    if (1 > 0) {
        let r = new ErrorResult('test text', 401)
        return r
    }

    return new JsonResult<any>({
        method: ctx.method,
        url: ctx.url,
        headers: ctx.headers,
        httpVersion: ctx.httpVersion,
    })
})

app.listen(3000)

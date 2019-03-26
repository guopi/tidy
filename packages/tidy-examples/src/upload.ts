import { JsonResult, TidyServerApp } from 'tidyjs'
import { tidyUploadPlugin } from 'tidy-upload'
import * as fs from 'fs'

new TidyServerApp()
    .use(tidyUploadPlugin())
    .use(async ctx => {
        const req = ctx.req
        const path1 = (req.files!.file1! as any).path!
        const file1Text = await new Promise((resolve, reject) => {
            fs.readFile(path1, 'utf-8', (err, data) => {
                if (err)
                    reject(err)
                else
                    resolve(data)
            })
        })
        return new JsonResult<any>({
            req: req,
            file1Text
        })
    })
    .listen(3000)

console.log(`upload example started. test command:
\thttp -v -f POST :3000/test/123 q1==1 field1=value1 field2.x=value2X file1@./README.md
`)

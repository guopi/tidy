import { pathOf, ServerApp } from 'tidyjs'
import { cookiePlugin } from 'tidy-cookie'
import { TidyUploadFile, uploadPlugin } from 'tidy-upload'

interface API_Test {
    params: {
        r1?: string,
    }
    cookies: {
        name1?: string
        cookie2?: string
    }
    files: { a?: TidyUploadFile }
    out: {
        body: {
            r1?: string
            r2: number
        }
    }
}

const app = new ServerApp()
app.use(cookiePlugin())
app.use(uploadPlugin({ tempDir: '/tmp' }))

app.onAll<API_Test>([pathOf`/test/${'r1'}`, pathOf`/test2/${'r1'}`], async input => {
    return {
        r1: '',
        r2: 1,
        input
    }
})

app.listen(3000)

import cookieParser from 'cookie-parser'
import * as express from 'express'
import * as tidy from 'tidyjs'

export function cookiePlugin(): tidy.TidyPlugin {
    return {
        create(app: tidy._TidyUnderlingApp) {
            (app as any as express.Express).use(cookieParser())
        }
    }
}

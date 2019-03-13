import cookieParser from 'cookie-parser'
import * as express from 'express'
import { _TidyUnderlingApp, TidyPlugin } from 'tidyjs'

export function cookiePlugin(): TidyPlugin {
    return {
        create(app: _TidyUnderlingApp) {
            (app as any as express.Express).use(cookieParser())
        }
    }
}

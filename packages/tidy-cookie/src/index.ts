import cookieParser from 'cookie-parser'
import * as express from 'express'
import { _TidyUnderlingApp, _TidyUnderlingRequest, TidyApiIn, TidyApiType, TidyPlugin } from 'tidyjs'

interface TidyApiTypeWithCookies extends TidyApiType {
    cookies?: _TidyCookies
}

export function cookiePlugin(): TidyPlugin {
    return {
        onPlug(app: _TidyUnderlingApp) {
            (app as any as express.Express).use(cookieParser())
        },
        onFilter(req: _TidyUnderlingRequest, input: TidyApiIn<TidyApiType>) {
            (input as TidyApiTypeWithCookies).cookies = (req as any as express.Request).cookies
            return undefined
        }
    }
}

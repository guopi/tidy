import * as cookie from 'cookie'
import { NamedStringDict, OrPromise, TidyContext, TidyNext, TidyPlugin, WithProperty } from 'tidyjs'
import { WithFiles } from '../../tidy-upload/src'

export type WithCookies<T> = WithProperty<T, { cookies?: NamedStringDict }>

interface WithCookieHeader {
    headers?: {
        cookie: string
    }
}

export function tidyCookieParser<REQ extends WithCookieHeader, RESP>(options?: cookie.CookieParseOptions): TidyPlugin<REQ, RESP, WithCookies<REQ>> {
    type NextReq = WithCookies<REQ>
    return function cookieParser(ctx: TidyContext<REQ>, next: TidyNext<NextReq, RESP>): OrPromise<RESP> {
        const req = (ctx.req as NextReq)
        if (!req.cookies) {
            const cookieHeader = req.headers && req.headers.cookie
            if (cookieHeader)
                req.cookies = cookie.parse(cookieHeader, options) as NextReq['cookies']
        }

        return next(ctx as any as TidyContext<NextReq>)
    }
}

tidyCookieParser.DISABLE_KEY = 'parseCookies'

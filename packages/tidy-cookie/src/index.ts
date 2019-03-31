import * as cookie from 'cookie'
import { NamedStringDict, NextPlugin, OrPromise, TidyPlugin, WebContext, WithProperties } from 'tidyjs'

export type WithCookies<T> = WithProperties<T, { cookies?: NamedStringDict }>

interface WithCookieHeader {
    headers?: {
        cookie?: string
    }
}

export function tidyCookieParser<Req extends WithCookieHeader, Resp>(options?: cookie.CookieParseOptions): TidyPlugin<Req, Resp, WithCookies<Req>> {
    type NextReq = WithCookies<Req>
    return function cookieParser(ctx: WebContext<Req>, next: NextPlugin<NextReq, Resp>): OrPromise<Resp> {
        const req = (ctx.req as NextReq)
        if (!req.cookies) {
            const cookieHeader = req.headers && req.headers.cookie
            if (cookieHeader)
                req.cookies = cookie.parse(cookieHeader, options) as NextReq['cookies']
        }

        return next(ctx as any as WebContext<NextReq>)
    }
}

tidyCookieParser.DISABLE_KEY = 'parseCookies'

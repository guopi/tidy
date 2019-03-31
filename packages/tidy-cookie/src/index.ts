import * as cookie from 'cookie'
import { NamedStringDict, OrPromise, TidyContext, TidyNext, TidyPlugin, WithProperty } from 'tidyjs'

export type WithCookies<T> = WithProperty<T, { cookies?: NamedStringDict }>

interface WithCookieHeader {
    headers?: {
        cookie: string
    }
}

export function tidyCookieParser<REQ extends WithCookieHeader, RESP>(options?: cookie.CookieParseOptions): TidyPlugin<REQ, RESP, WithCookies<REQ>> {
    return function cookieParser(ctx: TidyContext<REQ>, next: TidyNext<WithCookies<REQ>, RESP>): OrPromise<RESP> {
        const req = (ctx.req as WithCookies<REQ>)
        if (!req.cookies) {
            const cookieHeader = req.headers && req.headers.cookie
            if (cookieHeader)
                req.cookies = cookie.parse(cookieHeader, options)
        }

        return next(ctx as any as TidyContext<WithCookies<REQ>>)
    }
}

tidyCookieParser.DISABLE_KEY = 'parseCookies'

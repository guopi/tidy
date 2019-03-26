import * as cookie from 'cookie'
import { TidyBaseRequestType, TidyNext, TidyContext, TidyPlugin, TidyReturn } from 'tidyjs'

export type WithCookies<T> = T & {
    cookies?: _TidyCookies
}

export function tidyCookieParser<REQ extends TidyBaseRequestType = TidyBaseRequestType>(options?: cookie.CookieParseOptions): TidyPlugin<REQ, WithCookies<REQ>> {
    return function cookieParser(ctx: TidyContext<REQ>, next: TidyNext<WithCookies<REQ>>): TidyReturn<any> {
        const req = (ctx.req as WithCookies<REQ>)
        if (!req.cookies) {
            const cookieHeader = req.headers && req.headers.cookie
            if (cookieHeader)
                req.cookies = cookie.parse(cookieHeader, options)
        }

        return next(ctx as TidyContext<WithCookies<REQ>>)
    }
}

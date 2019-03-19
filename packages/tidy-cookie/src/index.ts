import * as cookie from 'cookie'
import { TidyBaseRequestType, TidyNextProcessor, TidyProcessContext, TidyProcessor, TidyProcessReturn } from 'tidyjs'

type WithCookies<T> = T & {
    cookies?: _TidyCookies
}

export function cookieProcessor<REQ extends TidyBaseRequestType = TidyBaseRequestType>(options?: cookie.CookieParseOptions): TidyProcessor<REQ, WithCookies<REQ>> {
    return function parseCookie(ctx: TidyProcessContext<REQ>, next: TidyNextProcessor<WithCookies<REQ>>): TidyProcessReturn<any> {
        const req = (ctx.req as WithCookies<REQ>)
        if (!req.cookies) {
            const cookieHeader = req.headers && req.headers.cookie
            if (cookieHeader)
                req.cookies = cookie.parse(cookieHeader, options)
        }

        return next(ctx as TidyProcessContext<WithCookies<REQ>>)
    }
}

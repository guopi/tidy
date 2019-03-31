import * as qs from 'qs'
import { NamedDict, WithProperty } from './types'
import { TidyContext } from './context'
import { TidyNext, TidyPlugin } from './app'
import { parse as parseUrl } from 'url'
import { OrPromise } from './result'

export type QueryStringParserOptions = qs.IParseOptions

const _defaultOpts = {
    allowDots: true
}

export type WithQuery<T> = WithProperty<T, { query?: NamedDict }>

export function tidyQueryStringParser<REQ extends {}, RESP>(options?: QueryStringParserOptions): TidyPlugin<REQ, RESP, WithQuery<REQ>> {
    type NextReq = WithQuery<REQ>
    const opts = options ? { ..._defaultOpts, ...options } : _defaultOpts
    return function queryStringParser(ctx: TidyContext<REQ>, next: TidyNext<NextReq, RESP>): OrPromise<RESP> {
        const req = ctx.req as NextReq
        if (req.query === undefined && !ctx.disabled(tidyQueryStringParser.DISABLE_KEY)) {
            const url = ctx.url
            let query: NextReq | undefined
            if (url !== undefined) {
                const q = parseUrl(url).query
                if (q != null) {
                    query = qs.parse(q, opts)
                }
            }
            req.query = query as NextReq['query']
        }

        return next(ctx as any as TidyContext<NextReq>)
    }
}

tidyQueryStringParser.DISABLE_KEY = 'parseQuery'

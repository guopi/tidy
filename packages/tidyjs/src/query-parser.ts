import * as qs from 'qs'
import { NamedDict, OrPromise, WithProperties } from './types'
import { WebContext } from './context'
import { parse as parseUrl } from 'url'
import { NextPlugin, TidyPlugin } from './plugin'

export type QueryStringParserOptions = qs.IParseOptions

const _defaultOpts = {
    allowDots: true
}

export type WithQuery<T> = WithProperties<T, { query?: NamedDict }>

export function tidyQueryStringParser<Req extends {}, Resp>(options?: QueryStringParserOptions): TidyPlugin<Req, Resp, WithQuery<Req>> {
    type NextReq = WithQuery<Req>
    const opts = options ? { ..._defaultOpts, ...options } : _defaultOpts
    return function queryStringParser(ctx: WebContext<Req>, next: NextPlugin<NextReq, Resp>): OrPromise<Resp> {
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

        return next(ctx as any as WebContext<NextReq>)
    }
}

tidyQueryStringParser.DISABLE_KEY = 'parseQuery'

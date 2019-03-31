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

export function tidyQueryStringParser<REQ, RESP>(options?: QueryStringParserOptions): TidyPlugin<REQ, RESP, WithQuery<REQ>> {
    const opts = options ? { ..._defaultOpts, ...options } : _defaultOpts
    return function queryStringParser(ctx: TidyContext<REQ>, next: TidyNext<WithQuery<REQ>, RESP>): OrPromise<RESP> {
        const req = ctx.req as WithQuery<REQ>
        if (req.query === undefined && !ctx.disabled(tidyQueryStringParser.DISABLE_KEY)) {
            const url = ctx.url
            let query: WithQuery<REQ>['query'] | undefined
            if (url !== undefined) {
                const q = parseUrl(url).query
                if (q != null) {
                    query = qs.parse(q, opts)
                }
            }
            req.query = query
        }

        return next(ctx as any as TidyContext<WithQuery<REQ>>)
    }
}

tidyQueryStringParser.DISABLE_KEY = 'parseQuery'

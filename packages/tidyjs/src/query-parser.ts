import * as qs from 'qs'
import { TidyBaseRequestType } from './types'
import { TidyProcessContext } from './context'
import { TidyNextProcessor } from './app'
import { TidyProcessReturnPromise } from './result'
import { parse as parseUrl } from 'url'

export type QueryStringParserOptions = qs.IParseOptions

const _defaultOpts = {
    allowDots: true
}

export function tidyQueryStringParser<REQ extends TidyBaseRequestType = TidyBaseRequestType>(options?: QueryStringParserOptions) {
    const opts = options ? { ..._defaultOpts, ...options } : _defaultOpts
    return async function queryStringParser(ctx: TidyProcessContext<REQ>, next: TidyNextProcessor<REQ>): TidyProcessReturnPromise<any> {
        if (ctx.req.query === undefined && !ctx.req._disableQueryParser) {
            const url = ctx.url
            let query: TidyBaseRequestType['query']
            if (url !== undefined) {
                const q = parseUrl(url).query
                if (q != null) {
                    query = qs.parse(q, opts)
                }
            }
            ctx.req.query = query || {}
        }

        return next(ctx)
    }
}

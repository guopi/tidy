import { WebContext } from './context'
import { WebReturn } from './result'
import { OrPromise } from './types'
import { WebRequest } from './web'

export type NextPlugin<Req, Resp>
    = (ctx: WebContext<Req>) => OrPromise<Resp>

export type TidyPlugin<Req = WebRequest, Resp = WebReturn, NextReq = Req, NextResp = Resp>
    = (ctx: WebContext<Req>, next: NextPlugin<NextReq, NextResp>) => OrPromise<Resp>

export interface TidyPluginLike<Req, Resp, NextReq = Req, NextResp = Resp> {
    asTidyPlugin(): TidyPlugin<Req, Resp, NextReq, NextResp>
}

export function composePlugins(array: TidyPlugin<any, any>[]): TidyPlugin<any, any> {
    switch (array.length) {
        case 0:
            return justCallNext
        case 1:
            return array[1]
    }

    return function (context: WebContext<any>, next: NextPlugin<any, any>): any {
        // last called #
        let lastIndex = -1

        return dispatch(0, context)

        function dispatch(i: number, ctx: WebContext<any>): OrPromise<any> {
            if (i <= lastIndex)
                return Promise.reject(new Error('next() called multiple times'))

            lastIndex = i
            try {
                if (i < array.length)
                    return array[i](ctx, dispatch.bind(null, i + 1))
                else
                    return next(ctx)
            } catch (err) {
                return Promise.reject(err)
            }
        }
    }
}

export function justCallNext<Req, Resp>(ctx: WebContext<Req>, next: NextPlugin<Req, Resp>): OrPromise<Resp> {
    return next(ctx)
}
import http from 'http'
import { TidyBaseRequestType } from './types'
import { AbstractResult, HeadResult, TidyErrorProcessor, TidyProcessReturn, TidyProcessReturnEntity } from './result'
import { ListenOptions } from 'net'
import { defaultErrorProcessor } from './error'
import { TidyProcessContext } from './context'

export type TidyNextProcessor<REQ extends TidyBaseRequestType = TidyBaseRequestType>
    = (ctx: TidyProcessContext<REQ>) => TidyProcessReturn<any>

export type TidyProcessor<REQ extends TidyBaseRequestType = TidyBaseRequestType,
    REQ2 extends TidyBaseRequestType = REQ>
    = (ctx: TidyProcessContext<REQ>, next: TidyNextProcessor<REQ2>) => TidyProcessReturn<any>

export interface TidyProcessorLike<REQ extends TidyBaseRequestType = TidyBaseRequestType, REQ2 extends TidyBaseRequestType = REQ> {
    asTidyProcessor(): TidyProcessor<REQ, REQ2>
}

export class TidyServerApp<REQ extends TidyBaseRequestType = TidyBaseRequestType> {
    private _processors: TidyProcessor<any, any>[] = []

    /**
     * add processor
     * @param fn {TidyProcessor} processor
     * @returns this
     */
    public use<REQ2 extends TidyBaseRequestType = REQ>(processor: TidyProcessor<REQ, REQ2> | TidyProcessorLike<REQ, REQ2>): TidyServerApp<REQ2> {
        if ((processor as TidyProcessorLike<REQ, REQ2>).asTidyProcessor)
            this._processors.push((processor as TidyProcessorLike<REQ, REQ2>).asTidyProcessor())
        else
            this._processors.push(processor as TidyProcessor<REQ, REQ2>)
        return this as any as TidyServerApp<REQ2>
    }

    listen(port?: number, hostname?: string, backlog?: number, listeningListener?: Function): void;
    listen(port?: number, hostname?: string, listeningListener?: Function): void;
    listen(port?: number, backlog?: number, listeningListener?: Function): void;
    listen(port?: number, listeningListener?: Function): void;
    listen(path: string, backlog?: number, listeningListener?: Function): void;
    listen(path: string, listeningListener?: Function): void;
    listen(options: ListenOptions, listeningListener?: Function): void;
    listen(handle: any, backlog?: number, listeningListener?: Function): void;
    listen(handle: any, listeningListener?: Function): void
    public listen(): void {
        const fn = _compose(this._processors)

        const server = http.createServer((req: http.IncomingMessage, resp: http.ServerResponse) => {
            const ctx = new TidyProcessContext(req,
                {
                    headers: req.headers
                }, defaultErrorProcessor) as TidyProcessContext<REQ>
            this._process(ctx, resp, fn)
        })
        server.listen(...arguments)
    }

    private _process(ctx: TidyProcessContext<REQ>, resp: http.ServerResponse, fn: TidyProcessor) {
        const _onerror: TidyErrorProcessor = ctx.onError
        const _send = _sendResult.bind(null, resp)

        Promise.resolve(fn(ctx, _defaultProcessor))
            .then(_send)
            .catch(err => {
                if (err != undefined) {
                    Promise.resolve(_onerror(err))
                        .then(_send)
                }
            })
    }
}

function _sendResult(resp: http.ServerResponse, result: TidyProcessReturnEntity): void {
    if (result !== undefined) {
        if (result instanceof AbstractResult)
            result.end(resp)
        else {
            resp.statusCode = 200
            resp.end(JSON.stringify(result))
        }
    } else {
        resp.end()
    }
}

function _defaultProcessor(): HeadResult {
    let r = new HeadResult()
    r.statusCode = 404
    return r
}

function _compose(array: TidyProcessor<any, any>[]): TidyProcessor {
    return function (context: TidyProcessContext, next: TidyNextProcessor<any>): TidyProcessReturn<any> {
        // last called #
        let lastIndex = -1

        return dispatch(0, context)

        function dispatch(i: number, ctx: TidyProcessContext): TidyProcessReturn<any> {
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
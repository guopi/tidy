import http from 'http'
import { TidyBaseRequestType } from './types'
import { AbstractResult, HeadResult, TidyErrorProcessor, TidyProcessReturn, TidyProcessReturnEntity } from './result'
import { ListenOptions } from 'net'
import { defaultErrorProcessor } from './error'

export class TidyProcessContext<REQ extends TidyBaseRequestType = TidyBaseRequestType> {
    constructor(public req: REQ, public onError: TidyErrorProcessor) {
    }

    get url(): string {
        return this.req._origin.url!
    }

    get httpVersion(): string {
        return this.req._origin.httpVersion!
    }

    get method(): string {
        return this.req._origin.method!
    }

    get headers(): REQ['headers'] {
        return this.req.headers
    }
}

export type TidyNextProcessor<REQ extends TidyBaseRequestType = TidyBaseRequestType>
    = (input: REQ) => TidyProcessReturn<any>

export type TidyProcessor<REQ extends TidyBaseRequestType = TidyBaseRequestType,
    REQ2 extends TidyBaseRequestType = TidyBaseRequestType>
    = (ctx: TidyProcessContext<REQ>, next?: TidyNextProcessor<REQ2>) => TidyProcessReturn<any>

export class TidyServerApp<REQ extends TidyBaseRequestType = TidyBaseRequestType> {
    private _processors: TidyProcessor<any, any>[] = []

    /**
     * add processor
     * @param fn {TidyProcessor} processor
     * @returns this
     */
    public use<REQ2 extends TidyBaseRequestType = TidyBaseRequestType>(processor: TidyProcessor<REQ, REQ2>): TidyServerApp<REQ2> {
        this._processors.push(processor)
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
            const ctx = new TidyProcessContext(
                {
                    _origin: req,
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
    return function (context: TidyProcessContext, next?: TidyNextProcessor<any>): TidyProcessReturn<any> {
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
                else if (next)
                    return next(ctx)
                else
                    return Promise.reject(new Error('no processors'))
            } catch (err) {
                return Promise.reject(err)
            }
        }
    }
}
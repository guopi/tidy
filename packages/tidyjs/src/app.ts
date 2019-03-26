import http from 'http'
import pino from 'pino'
import { TidyBaseRequestType, TidyLogger } from './types'
import {
    AbstractResult,
    HeadResult,
    JsonResult,
    TidyErrorHandler,
    TidyReturn,
    TidyReturnEntity
} from './result'
import { ListenOptions } from 'net'
import { defaultErrorHandler } from './error'
import { TidyContext } from './context'

export type TidyNext<REQ extends TidyBaseRequestType = TidyBaseRequestType>
    = (ctx: TidyContext<REQ>) => TidyReturn<any>

export type TidyPlugin<REQ extends TidyBaseRequestType = TidyBaseRequestType,
    REQ2 extends TidyBaseRequestType = REQ>
    = (ctx: TidyContext<REQ>, next: TidyNext<REQ2>) => TidyReturn<any>

export interface TidyPluginLike<REQ extends TidyBaseRequestType = TidyBaseRequestType, REQ2 extends TidyBaseRequestType = REQ> {
    asTidyPlugin(): TidyPlugin<REQ, REQ2>
}

export interface TidyServerAppOptions {
    logger?: TidyLogger
}

export class TidyServerApp<REQ extends TidyBaseRequestType = TidyBaseRequestType> {
    private _plugins: TidyPlugin<any, any>[] = []
    private _logger: TidyLogger

    constructor(opts?: TidyServerAppOptions) {
        this._logger = opts && opts.logger || pino()
    }

    /**
     * use plugin
     * @param plugin {TidyPlugin}
     * @returns this
     */
    public use<REQ2 extends TidyBaseRequestType = REQ>(plugin: TidyPlugin<REQ, REQ2> | TidyPluginLike<REQ, REQ2>): TidyServerApp<REQ2> {
        if ((plugin as TidyPluginLike<REQ, REQ2>).asTidyPlugin)
            this._plugins.push((plugin as TidyPluginLike<REQ, REQ2>).asTidyPlugin())
        else
            this._plugins.push(plugin as TidyPlugin<REQ, REQ2>)
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
        const fn = _compose(this._plugins)

        const server = http.createServer((req: http.IncomingMessage, resp: http.ServerResponse) => {
            const ctx = new TidyContext(req,
                { headers: req.headers },
                defaultErrorHandler,
                this._logger
            ) as TidyContext<REQ>
            this._process(ctx, resp, fn)
        })
        server.listen(...arguments)
    }

    private _process(ctx: TidyContext<REQ>, resp: http.ServerResponse, fn: TidyPlugin) {
        const _onerror: TidyErrorHandler = ctx.onError
        const methodIsNotHead = ctx.method.toUpperCase() !== 'HEAD'

        function _send(result: TidyReturnEntity) {
            if (result !== undefined) {
                if (result instanceof AbstractResult) {
                    result.sendHead(resp)
                    if (methodIsNotHead)
                        result.sendBody(resp)
                } else {
                    resp.statusCode = 200
                    resp.setHeader('Content-Type', JsonResult.Content_Type)

                    if (methodIsNotHead)
                        resp.write(JSON.stringify(result))
                }
            }
            resp.end()
        }

        Promise.resolve(fn(ctx, _defaultPlugin))
            .then(_send)
            .catch(err => {
                if (err != undefined) {
                    Promise.resolve(_onerror(err))
                        .then(_send)
                }
            })
    }
}

function _defaultPlugin(): HeadResult {
    let r = new HeadResult()
    r.statusCode = 404
    return r
}

function _compose(array: TidyPlugin<any, any>[]): TidyPlugin {
    return function (context: TidyContext, next: TidyNext<any>): TidyReturn<any> {
        // last called #
        let lastIndex = -1

        return dispatch(0, context)

        function dispatch(i: number, ctx: TidyContext): TidyReturn<any> {
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
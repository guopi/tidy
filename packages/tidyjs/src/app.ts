import http from 'http'
import pino from 'pino'
import { TidyLogger, TidyRequest, TidyResponse } from './types'
import { AbstractResult, HeadResult, HttpReturn, JsonResult, OrPromise, TidyErrorHandler } from './result'
import { ListenOptions } from 'net'
import { defaultErrorHandler } from './error'
import { TidyContext } from './context'

export type TidyNext<REQ, RESP>
    = (ctx: TidyContext<REQ>) => OrPromise<RESP>

export type TidyPlugin<REQ = TidyRequest, RESP = HttpReturn<TidyResponse>, NextReq = REQ, NextResp = RESP>
    = (ctx: TidyContext<REQ>, next: TidyNext<NextReq, NextResp>) => OrPromise<RESP>

export interface TidyPluginLike<REQ, RESP, NextReq, NextResp> {
    asTidyPlugin(): TidyPlugin<REQ, RESP, NextReq, NextResp>
}

export interface TidyServerAppOptions {
    logger?: TidyLogger
}

interface TidyPluginHub<REQ, RESP> {
    use<NextReq = REQ, NextResp = RESP>(plugin: TidyPlugin<REQ, RESP, NextReq, NextResp> | TidyPluginLike<REQ, RESP, NextReq, NextResp>): TidyPluginHub<NextReq, NextResp>
}

export class TidyServerApp implements TidyPluginHub<TidyRequest, HttpReturn<TidyResponse>> {
    private _plugins: TidyPlugin<any, any, any, any>[] = []
    private _logger: TidyLogger

    constructor(opts?: TidyServerAppOptions) {
        this._logger = opts && opts.logger || pino()
    }

    /**
     * use plugin
     * @param plugin {TidyPlugin}
     * @returns this
     */
    public use<NextReq, NextResp>(plugin: TidyPlugin<TidyRequest, HttpReturn<TidyResponse>, NextReq, NextResp> | TidyPluginLike<TidyRequest, HttpReturn<TidyResponse>, NextReq, NextResp>): TidyPluginHub<NextReq, NextResp> {
        if ((plugin as TidyPluginLike<TidyRequest, HttpReturn<TidyResponse>, NextReq, NextResp>).asTidyPlugin)
            this._plugins.push((plugin as TidyPluginLike<TidyRequest, HttpReturn<TidyResponse>, NextReq, NextResp>).asTidyPlugin())
        else
            this._plugins.push(plugin as TidyPlugin<TidyRequest, HttpReturn<TidyResponse>, NextReq, NextResp>)
        return this as any as TidyPluginHub<NextReq, NextResp>
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

        const server = http.createServer((_originReq: http.IncomingMessage, resp: http.ServerResponse) => {
            const req: TidyRequest = { headers: _originReq.headers }
            const ctx = new TidyContext(_originReq, req, defaultErrorHandler, this._logger
            )
            this._process(ctx, resp, fn)
        })
        server.listen(...arguments)
    }

    private _process(ctx: TidyContext, resp: http.ServerResponse, fn: TidyPlugin) {
        const _onerror: TidyErrorHandler = ctx.onError
        const methodIsNotHead = ctx.method.toUpperCase() !== 'HEAD'

        function _send(result: HttpReturn<TidyResponse>) {
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
    return function (context: TidyContext, next: TidyNext<any, any>): any {
        // last called #
        let lastIndex = -1

        return dispatch(0, context)

        function dispatch(i: number, ctx: TidyContext): OrPromise<any> {
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
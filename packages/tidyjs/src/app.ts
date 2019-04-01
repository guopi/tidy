import http from 'http'
import pino from 'pino'
import { TidyLogger } from './logger'
import { WebRequest, WebResponse } from './web'
import { AbstractResult, ErrorBuilder, HeadResult, JsonResult, WebReturn } from './result'
import { ListenOptions } from 'net'
import { defaultErrorBuilder } from './error'
import { WebContext } from './context'
import { composePlugins, TidyPlugin, TidyPluginLike } from './plugin'

export interface TidyServerAppOptions {
    logger?: TidyLogger
}

export function tidyServerApp(opts?: TidyServerAppOptions): ServerApp<WebRequest, WebReturn> {
    return new ServerApp(opts)
}

class ServerApp<Req = WebRequest, Resp = WebReturn> {
    private _plugins: TidyPlugin<any, any>[] = []
    private readonly _logger: TidyLogger

    constructor(opts?: TidyServerAppOptions) {
        this._logger = opts && opts.logger || pino()
    }

    /**
     * use plugin
     * @param plugin {TidyPlugin}
     * @returns this
     */
    public use<NextReq, NextResp>(
        plugin:
            TidyPlugin<Req, Resp, NextReq, NextResp>
            | TidyPluginLike<Req, Resp, NextReq, NextResp>
    ): ServerApp<NextReq, NextResp> {

        if ((plugin as TidyPluginLike<any, any>).asTidyPlugin)
            this._plugins.push((plugin as TidyPluginLike<any, any>).asTidyPlugin())
        else
            this._plugins.push(plugin as TidyPlugin<any, any>)

        return this as any as ServerApp<NextReq, NextResp>
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
        const fn = composePlugins(this._plugins)

        const server = http.createServer((_originReq: http.IncomingMessage, resp: http.ServerResponse) => {
            const req: WebRequest = { headers: _originReq.headers }
            const ctx = new WebContext(
                _originReq,
                req,
                defaultErrorBuilder,
                this._logger
            )
            this._process(ctx, resp, fn)
        })
        server.listen(...arguments)
    }

    private _process(ctx: WebContext<WebRequest>, resp: http.ServerResponse, fn: TidyPlugin) {
        const _onerror: ErrorBuilder = ctx.errorBuilder
        const methodIsNotHead = ctx.method.toUpperCase() !== 'HEAD'

        function _send(result: WebReturn<WebResponse>) {
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

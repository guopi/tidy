import express from 'express'
import { createServer } from 'http'
import { Express, PathParams, RequestHandler } from 'express-serve-static-core'
import { AbstractResult, TidyApiImplement } from './result'
import {
    _TidyUnderlingApp, _TidyUnderlingResponse, TidyApiEntry,
    TidyApiIn,
    TidyApiMethod,
    TidyApiType,
    TidyPlugin, TidyRoutePath,
    TidyRoutePaths,
    TidyServerAppOptions
} from './types'

type InputPrepareFunc = (req: express.Request, input: TidyApiIn<TidyApiType>) => TidyApiIn<TidyApiType>

export class ServerApp {
    private readonly _app: Express
    private _prepareFuncs?: InputPrepareFunc[]

    constructor(options?: TidyServerAppOptions) {
        const app = express()
        app.use(express.json(options && options.bodyLimit
            ? {
                limit: options.bodyLimit
            }
            : undefined
        )).use(express.urlencoded({
            extended: true,
            limit: options && options.bodyLimit
        }))
        this._app = app
    }

    use(plugin: TidyPlugin): void {
        if (plugin.create)
            plugin.create(this._app as any as _TidyUnderlingApp)
        if (plugin.prepare) {
            if (!this._prepareFuncs)
                this._prepareFuncs = []
            this._prepareFuncs.push(plugin.prepare as any as InputPrepareFunc)
        }
    }

    on<R extends TidyApiType>(method: TidyApiMethod, path: TidyRoutePaths<R>, fn: TidyApiImplement<R>): this {
        const expressMethod: (path: PathParams, handlers: RequestHandler) => void = this._app[method]
        const expressHandler = (req: express.Request, resp: express.Response) => {
            let input: TidyApiIn<R> = {
                headers: req.headers,
                params: req.params,
                query: req.query,
                body: req.body,
                cookies: req.cookies
            } as any

            const prepares = this._prepareFuncs
            if (prepares) {
                for (const f of prepares) {
                    input = f(req, input) as TidyApiIn<R>
                }
            }

            const promise = fn(input).then(r => {
                if (r instanceof AbstractResult)
                    r.send(resp as any as _TidyUnderlingResponse)
                else if (typeof r === 'object')
                    resp.json(r)
                else {
                    //todo error type
                    this._onError('wrong result type', resp)
                }
            }).catch(e => this._onError(e, resp))

            if (input._onClean) {
                promise.then(input._onClean, input._onClean)
            }
        }
        if (Array.isArray(path)) {
            for (const p of path) {
                expressMethod.call(this._app, toExpressRoute(p), expressHandler)
            }
        } else {
            expressMethod.call(this._app, toExpressRoute(path), expressHandler)
        }
        return this
    }

    private _onError(e: any, resp: express.Response): void {
        //todo
    }

    onGet<R extends TidyApiType>(path: TidyRoutePaths<R>, fn: TidyApiImplement<R>): this {
        return this.on('get', path, fn)
    }

    onAll<R extends TidyApiType>(path: TidyRoutePaths<R>, fn: TidyApiImplement<R>): this {
        return this.on('all', path, fn)
    }

    onPost<R extends TidyApiType>(path: TidyRoutePaths<R>, fn: TidyApiImplement<R>): this {
        return this.on('post', path, fn)
    }

    route<R extends TidyApiType>(define: TidyApiEntry<R>, fn: TidyApiImplement<R>) {
        return this.on(define.method, define.path, fn)
    }

    listen(port: number, host?: string, backlog?: number): void {
        const server = createServer(this._app)
        server.listen({
            port,
            host,
            backlog
        })
    }
}

function toExpressRoute(path: TidyRoutePath<any>): string {
    if (typeof path === 'string') {
        return path
    }

    let ret = ''
    for (const part of path.parts) {
        ret += (typeof part === 'string'
                ? part
                : (part.pattern ? `:${part.param as any}(${part.pattern})` : `:${part.param as any}`)
        )
    }
    return ret
}


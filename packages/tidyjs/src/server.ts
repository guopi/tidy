import express from 'express'
import { createServer } from 'http'
import { Express, PathParams, RequestHandler } from 'express-serve-static-core'
import { AbstractResult, TidyApiImplement } from './result'
import {
    _TidyUnderlingApp,
    _TidyUnderlingResponse,
    TidyApiEntry,
    TidyApiIn,
    TidyApiInputCleaner,
    TidyApiMethod,
    TidyApiType,
    TidyCleanableApiIn,
    TidyPlugin,
    TidyRoutePath,
    TidyRoutePaths,
    TidyServerAppOptions
} from './types'

type ApiInPrepareFunc = (req: express.Request, input: TidyApiIn<TidyApiType>) => void

export class ServerApp {
    private readonly _app: Express
    private _prepareFuncs?: ApiInPrepareFunc[]

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
            this._prepareFuncs.push(plugin.prepare as any as ApiInPrepareFunc)
        }
    }

    on<R extends TidyApiType>(method: TidyApiMethod, path: TidyRoutePaths<R>, fn: TidyApiImplement<R>): this {
        const expressMethod: (path: PathParams, handlers: RequestHandler) => void = this._app[method]
        const expressHandler = (req: express.Request, resp: express.Response) => {
            const input: ApiInputImpl<R> & TidyApiIn<R> = new ApiInputImpl(req) as any
            const prepares = this._prepareFuncs
            if (prepares) {
                for (const f of prepares) {
                    f(req, input)
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

            if (input._cleans) {
                const cleanUp = () => {
                    input.cleanAll(e => this._onError(e, resp))
                }
                promise.then(cleanUp, cleanUp)
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

class ApiInputImpl<R extends TidyApiType> implements TidyCleanableApiIn<R> {
    headers: R['headers']
    params: R['params']
    query: R['query']
    body: R['body']

    _cleans?: TidyApiInputCleaner<R>[]

    constructor(req: express.Request) {
        this.headers = req.headers
        this.params = req.params
        this.query = req.query
        this.body = req.body
    }

    cleanLater(cleaner: TidyApiInputCleaner<R>) {
        if (!this._cleans)
            this._cleans = [cleaner]
        else
            this._cleans.unshift(cleaner)
    }

    cleanAll = (onError?: (error: any) => void) => {
        if (this._cleans) {
            for (const c of this._cleans) {
                try {
                    c(this as any as TidyApiIn<R>)
                } catch (e) {
                    if (onError)
                        onError(e)
                    else {
                        //todo log
                        console.warn('cleaner error', e)
                    }
                }
            }
        }
    }
}
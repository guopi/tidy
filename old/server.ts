import express from 'express'
import { createServer } from 'http'
import { Express, PathParams, RequestHandler } from 'express-serve-static-core'
import { AbstractResult, TidyApiImplement, TidyApiResult } from './result'
import {
    TidyApiEntry,
    TidyApiInput,
    TidyApiInputCleaner,
    TidyApiMethod,
    TidyApiType,
    TidyApiInputMethods,
    TidyRoutePath,
    TidyRoutePaths,
    TidyServerAppOptions
} from './types'

import { _TidyUnderlingApp, _TidyUnderlingRequest } from './underling'

export interface TidyPlugin {
    onPlug?: (app: _TidyUnderlingApp) => void

    /**
     * @param req
     * @param input for prepare data
     * @returns undefined : continue
     * @returns TidyApiResult<any> : terminate immediately and return the result
     */
    onFilter?: (req: _TidyUnderlingRequest, input: TidyApiInput<TidyApiType>) => undefined | TidyApiResult<TidyApiType>
}

export class ServerApp {
    private readonly _app: Express
    private _filters?: NonNullable<TidyPlugin['onFilter']>[]

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
        if (plugin.onPlug)
            plugin.onPlug(this._app)
        if (plugin.onFilter) {
            if (!this._filters)
                this._filters = []
            this._filters.push(plugin.onFilter)
        }
    }

    on<R extends TidyApiType>(method: TidyApiMethod, path: TidyRoutePaths<R>, fn: TidyApiImplement<R>): this {
        const expressMethod: (path: PathParams, handlers: RequestHandler) => void = this._app[method]
        const expressHandler = (req: express.Request, resp: express.Response) => {
            const input: ApiInputImpl<R> & TidyApiInput<R> = new ApiInputImpl(req) as any
            const filters = this._filters
            if (filters) {
                for (const f of filters) {
                    const r = f(req, input)
                    if (r !== undefined) {
                        this.sendResult(resp, r)
                        return
                    }
                }
            }

            const promise = Promise.resolve(fn(input))
                .then(r => {
                    this.sendResult(resp, r)
                })
                .catch(e => this._onError(e, resp))

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

    private sendResult(to: express.Response, result: TidyApiResult<any>) {
        if (result instanceof AbstractResult)
            result.end(to)
        else if (typeof result === 'object')
            to.json(result)
        else {
            //todo error type
            this._onError('wrong result type', to)
        }
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
                : (part.pattern ? `:${part.param}(${part.pattern})` : `:${part.param}`)
        )
    }
    return ret
}

class ApiInputImpl<R extends TidyApiType> implements TidyApiInputMethods<R> {
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
                    c(this as any as TidyApiInput<R>)
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
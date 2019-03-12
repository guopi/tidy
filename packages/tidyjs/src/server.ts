/// <reference path="../types/tidyjs.d.ts" />

import ex from 'express'
import { createServer } from 'http'
import { Express, PathParams, RequestHandler } from 'express-serve-static-core'
import { AbstractResponse, ApiReturn } from './response-result'

export type ApiImplement<R extends tidy.ApiType> = (req: tidy.ApiInput<R>) => Promise<ApiReturn<R>>

export class ServerApp {
    private readonly express: Express

    constructor(options?: tidy.ServerAppOptions) {
        const express = ex()
        express.use(ex.json(options && options.bodyLimit
            ? {
                limit: options.bodyLimit
            }
            : undefined
        )).use(ex.urlencoded({
            extended: true,
            limit: options && options.bodyLimit
        }))
        this.express = express
    }

    on<R extends tidy.ApiType>(method: tidy.HttpMethod, path: tidy.RoutePaths<R>, fn: ApiImplement<R>): this {
        const expressMethod: (path: PathParams, handlers: RequestHandler) => void = this.express[method]
        const expressHandler = (req: ex.Request, resp: ex.Response) => {
            const input: tidy.ApiInput<R> = {
                headers: req.headers,
                params: req.params,
                query: req.query,
                body: req.body,
                files: (req as any).files,  //todo
                cookies: req.cookies
            } as any
            const promise = fn(input).then(r => {
                if (r instanceof AbstractResponse)
                    r.send(resp)
                else if (typeof r === 'object')
                    resp.json(r)
                else {
                    //todo error type
                    this._onError('wrong result type', resp)
                }
            }).catch(e => this._onError(e, resp))

            if ((req as any).files) {   //todo
                let clean = () => {
                    //todo delete uploaded files
                }
                promise.then(clean, clean)
            }
        }
        if (Array.isArray(path)) {
            for (const p of path) {
                expressMethod.call(this.express, toExpressRoute(p), expressHandler)
            }
        } else {
            expressMethod.call(this.express, toExpressRoute(path), expressHandler)
        }
        return this
    }

    private _onError(e: any, resp: ex.Response): void {
        //todo
    }

    onGet<R extends tidy.ApiType>(path: tidy.RoutePaths<R>, fn: ApiImplement<R>): this {
        return this.on('get', path, fn)
    }

    onAll<R extends tidy.ApiType>(path: tidy.RoutePaths<R>, fn: ApiImplement<R>): this {
        return this.on('all', path, fn)
    }

    onPost<R extends tidy.ApiType>(path: tidy.RoutePaths<R>, fn: ApiImplement<R>): this {
        return this.on('post', path, fn)
    }

    route<R extends tidy.ApiType>(define: tidy.ApiDefine<R>, fn: ApiImplement<R>) {
        return this.on(define.method, define.path, fn)
    }

    listen(port: number, host?: string, backlog?: number): void {
        const server = createServer(this.express)
        server.listen({
            port,
            host,
            backlog
        })
    }
}

function toExpressRoute(path: tidy.RoutePath<any>): string {
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


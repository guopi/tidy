import * as ex from 'express'
import * as http from 'http'
import { Express, PathParams, RequestHandler } from 'express-serve-static-core'

abstract class BaseTidyResponse {
    abstract send(resp: ex.Response): void
}

export class TidyError extends BaseTidyResponse {
    constructor(readonly error: ResponseError) {
        super()
    }

    send(resp: ex.Response): void {
        //todo
    }
}

export class TextResponse extends BaseTidyResponse {
    constructor(readonly text: string) {
        super()
    }

    send(resp: ex.Response): void {
        resp.send(this.text)
    }
}

export class JsonResponse<Resp extends TidyResponse | undefined> extends BaseTidyResponse {
    constructor(readonly json: Resp) {
        super()
    }

    send(resp: ex.Response): void {
        if (this.json)
            resp.json(this.json)
    }
}

type ApiReturn<R extends ApiType> = TidyResponseBodyOf<R> | JsonResponse<R['resp']> | TidyError | TextResponse

export type ApiImplement<R extends ApiType> = (req: ApiInput<R>) => Promise<ApiReturn<R>>

export class ServerApp {
    private readonly express: Express

    constructor() {
        this.express = ex()
            .use(ex.json())
            .use(ex.urlencoded({ extended: true }))
    }

    on<R extends ApiType>(
        method: HttpMethod,
        path: RoutePath<R>,
        fn: ApiImplement<R>,
        schema?: ApiSchema<R>): this {
        const expressMethod: (path: PathParams, handlers: RequestHandler) => void = this.express[method]
        expressMethod.call(this.express, toExpressRoute(path), (req: ex.Request, resp: ex.Response) => {
            //todo validate
            const input: ApiInput<R> = {
                headers: req.headers,
                params: req.params,
                query: req.query,
                body: req.body
            } as any
            fn(input).then(r => {
                if (r instanceof BaseTidyResponse)
                    r.send(resp)
                else if (typeof r === 'object')
                    resp.json(r)
                else {
                    //todo error type
                    this._onError('wrong result type', resp)
                }
            }).catch(e => this._onError(e, resp))
        })
        return this
    }

    private _onError(e: any, resp: ex.Response): void {
        //todo
    }

    onGet<R extends ApiType>(path: RoutePath<R>, fn: ApiImplement<R>, schema?: ApiSchema<R>): this {
        return this.on('get', path, fn, schema)
    }

    onAll<R extends ApiType>(path: RoutePath<R>, fn: ApiImplement<R>, schema?: ApiSchema<R>): this {
        return this.on('all', path, fn, schema)
    }

    onPost<R extends ApiType>(path: RoutePath<R>, fn: ApiImplement<R>, schema?: ApiSchema<R>): this {
        return this.on('post', path, fn, schema)
    }

    route<R extends ApiType>(define: ApiDefine<R>, fn: ApiImplement<R>) {
        return this.on(define.method, define.path, fn, define.schema)
    }

    listen(port: number, host?: string, backlog?: number): void {
        const server = http.createServer(this.express)
        server.listen({
            port,
            host,
            backlog
        })
    }
}

function toExpressRoute(path: RoutePath<any>): string {
    if (typeof path === 'string') {
        return path
    }

    let ret = ''
    for (const part of path) {
        ret += (typeof part === 'string'
                ? part
                : (part.pattern ? `:${part.param as any}(${part.pattern})` : `:${part.param as any}`)
        )
    }
    return ret
}


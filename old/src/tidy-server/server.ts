import * as ex from 'express'
import * as http from 'http'
import * as cookieParser from 'cookie-parser'
import * as fileUpload from 'express-fileupload'
import { Express, PathParams, RequestHandler } from 'express-serve-static-core'

abstract class AbstractResponse {
    abstract send(resp: ex.Response): void
}

export class ErrorResponse extends AbstractResponse {
    constructor(readonly error: ResponseError) {
        super()
    }

    send(resp: ex.Response): void {
        resp.json({
            error: this.error
        })
    }
}

export class TextResponse extends AbstractResponse {
    constructor(readonly text: string) {
        super()
    }

    send(resp: ex.Response): void {
        resp.send(this.text)
    }
}

export class JsonResponse<Resp extends TidyResponse | undefined> extends AbstractResponse {
    constructor(readonly json: Resp) {
        super()
    }

    send(resp: ex.Response): void {
        if (this.json)
            resp.json(this.json)
    }
}

type ApiReturn<R extends ApiType> = TidyResponseBodyOf<R> | JsonResponse<R['resp']> | ErrorResponse | TextResponse

export type ApiImplement<R extends ApiType> = (req: ApiInput<R>) => Promise<ApiReturn<R>>

export class ServerApp {
    private readonly express: Express

    constructor(options?: ServerAppOptions) {
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
        if (options) {
            if (options.useCookie) {
                express.use(cookieParser())
            }
            if (options.upload) {
                const opt: fileUpload.Options = {
                    useTempFiles: true,
                    tempFileDir: options.upload.tempDir
                }
                if (options.upload.fileSizeLimit) {
                    opt.limits = {
                        fileSize: options.upload.fileSizeLimit
                    }
                }
                express.use(fileUpload(opt))
            }
        }

        this.express = express
    }

    on<R extends ApiType>(method: HttpMethod, path: RoutePaths<R>, fn: ApiImplement<R>): this {
        const expressMethod: (path: PathParams, handlers: RequestHandler) => void = this.express[method]
        const expressHandler = (req: ex.Request, resp: ex.Response) => {
            const input: ApiInput<R> = {
                headers: req.headers,
                params: req.params,
                query: req.query,
                body: req.body,
                files: req.files,
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

            if (req.files) {
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

    onGet<R extends ApiType>(path: RoutePaths<R>, fn: ApiImplement<R>): this {
        return this.on('get', path, fn)
    }

    onAll<R extends ApiType>(path: RoutePaths<R>, fn: ApiImplement<R>): this {
        return this.on('all', path, fn)
    }

    onPost<R extends ApiType>(path: RoutePaths<R>, fn: ApiImplement<R>): this {
        return this.on('post', path, fn)
    }

    route<R extends ApiType>(define: ApiDefine<R>, fn: ApiImplement<R>) {
        return this.on(define.method, define.path, fn)
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
    for (const part of path.parts) {
        ret += (typeof part === 'string'
                ? part
                : (part.pattern ? `:${part.param as any}(${part.pattern})` : `:${part.param as any}`)
        )
    }
    return ret
}


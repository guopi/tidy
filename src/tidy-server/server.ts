import * as ex from 'express'

abstract class BaseTidyResponse {
    protected abstract send(resp: ex.Response): void
}

export class TidyError extends BaseTidyResponse {
    constructor(readonly error: ResponseError) {
        super()
    }

    protected send(resp: ex.Response): void {
        //todo
    }
}

export class TextResponse extends BaseTidyResponse {
    constructor(readonly text: string) {
        super()
    }

    protected send(resp: ex.Response): void {
        resp.send(this.text)
    }
}

export class JsonResponse<Resp extends TidyResponse | undefined> extends BaseTidyResponse {
    constructor(readonly json: Resp) {
        super()
    }

    protected send(resp: ex.Response): void {
        if (this.json)
            resp.send(this.json)
    }
}

type ApiReturn<R extends ApiType> = TidyResponseBodyOf<R> | JsonResponse<R['resp']> | TidyError | TextResponse

export type ApiImplement<R extends ApiType> = (req: R) => Promise<ApiReturn<R>>

export class ServerApp {
    on<R extends ApiType>(
        method: HttpMethod,
        path: RoutePath<R>,
        fn: ApiImplement<R>,
        schema?: ApiSchema<R>): this {
        //todo
        return this
    }

    onGet<R extends ApiType>(path: RoutePath<R>, fn: ApiImplement<R>, schema?: ApiSchema<R>): this {
        return this.on('get', path, fn, schema)
    }

    onPost<R extends ApiType>(path: RoutePath<R>, fn: ApiImplement<R>, schema?: ApiSchema<R>): this {
        return this.on('post', path, fn, schema)
    }

    route<R extends ApiType>(define: ApiDefine<R>, fn: ApiImplement<R>) {
        return this.on(define.method, define.path, fn, define.schema)
    }

    listen(port: number) {
        //todo
    }
}


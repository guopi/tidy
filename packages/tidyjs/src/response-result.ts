import * as ex from 'express'

type ExResponse = any

export abstract class AbstractResponse {
    abstract send(resp: ExResponse): void
}

export class ErrorResponse extends AbstractResponse {
    constructor(readonly error: tidy.ResponseError) {
        super()
    }

    send(resp: ExResponse): void {
        (resp as ex.Response).json({
            error: this.error
        })
    }
}

export class TextResponse extends AbstractResponse {
    constructor(readonly text: string) {
        super()
    }

    send(resp: ExResponse): void {
        resp.send(this.text)
    }
}

export class JsonResponse<Resp extends tidy.Response | undefined> extends AbstractResponse {
    constructor(readonly json: Resp) {
        super()
    }

    send(resp: ExResponse): void {
        if (this.json)
            resp.json(this.json)
    }
}

export type ApiReturn<R extends tidy.ApiType> =
    tidy.ResponseBodyOf<R>
    | JsonResponse<R['resp']>
    | ErrorResponse
    | TextResponse

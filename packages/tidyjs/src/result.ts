import * as ex from 'express'
import { _TidyUnderlingResponse, TidyApiError, TidyApiIn, TidyApiOutType, TidyApiType, TidyOutBodyOf } from './types'

export abstract class AbstractResult {
    abstract send(resp: _TidyUnderlingResponse): void
}

export class JsonResult<Resp extends TidyApiOutType | undefined> extends AbstractResult {
    constructor(readonly json: Resp) {
        super()
    }

    send(resp: _TidyUnderlingResponse): void {
        if (this.json)
            (resp as any as ex.Response).json(this.json)
    }
}

export abstract class BaseResult extends AbstractResult {
    abstract send(resp: _TidyUnderlingResponse): void
}

export class ErrorResult extends BaseResult {
    constructor(readonly error: TidyApiError) {
        super()
    }

    send(resp: _TidyUnderlingResponse): void {
        (resp as any as ex.Response).json({
            error: this.error
        })
    }
}

export class TextResult extends BaseResult {
    constructor(readonly text: string) {
        super()
    }

    send(resp: _TidyUnderlingResponse): void {
        (resp as any as ex.Response).send(this.text)
    }
}

export type TidyApiOut<R extends TidyApiType> = TidyOutBodyOf<R> | JsonResult<R['out']> | BaseResult
export type TidyApiImplement<R extends TidyApiType> = (input: TidyApiIn<R>) => Promise<TidyApiOut<R>>

import ex from 'express'
import {
    _TidyUnderlingResponse,
    TidyApiIn,
    TidyApiOutType,
    TidyApiType,
    TidyNonNilSimpleData,
    TidyOutBodyOf
} from './types'

type ResponseAction = (resp: _TidyUnderlingResponse) => void

export abstract class AbstractResult {
    private _actions ?: ResponseAction[]

    end(resp: _TidyUnderlingResponse): void {
        if (this._actions) {
            for (const action of this._actions) {
                action(resp)
            }
        }
        this._end(resp)
    }

    protected abstract _end(resp: _TidyUnderlingResponse): void

    addAction(action: ResponseAction) {
        if (this._actions)
            this._actions.push(action)
        else
            this._actions = [action]
    }

    status(code: number) {
        this.addAction(resp => (resp as any as ex.Response).status(code))
    }

    /**
     * Set Content-Type response header with `type` through `mime.lookup()`
     * when it does not contain "/", or set the Content-Type to `type` otherwise.
     *
     * Examples:
     *     res.type('.html');
     *     res.type('html');
     *     res.type('json');
     *     res.type('application/json');
     *     res.type('png');
     */
    type(type: string) {
        this.addAction(resp => (resp as any as ex.Response).contentType(type))
    }

    header(field: string, value: string) {
        this.addAction(resp => (resp as any as ex.Response).header(field, value))
    }
}

export class JsonResult<Resp extends TidyApiOutType | undefined> extends AbstractResult {
    constructor(readonly json: Resp) {
        super()
    }

    protected _end(resp: _TidyUnderlingResponse): void {
        if (this.json)
            (resp as any as ex.Response).json(this.json)
    }
}

export abstract class BaseResult extends AbstractResult {
    protected abstract _end(resp: _TidyUnderlingResponse): void
}

export class ErrorResult extends BaseResult {
    constructor(readonly error: TidyNonNilSimpleData) {
        super()
    }

    protected _end(resp: _TidyUnderlingResponse): void {
        (resp as any as ex.Response).json({
            error: this.error
        })
    }
}

export class TextResult extends BaseResult {
    constructor(readonly text: string) {
        super()
    }

    protected _end(resp: _TidyUnderlingResponse): void {
        (resp as any as ex.Response).send(this.text)
    }
}

export type TidyApiOut<R extends TidyApiType> = TidyOutBodyOf<R> | JsonResult<R['out']> | BaseResult
export type TidyApiImplement<R extends TidyApiType> = (input: TidyApiIn<R>) => TidyApiOut<R> | Promise<TidyApiOut<R>>

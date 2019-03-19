import { TidyApiInput, TidyApiOutType, TidyApiType, TidyNonNilSimpleData, TidyApiOutBody } from './types'
import { _TidyUnderlingResponse } from './underling'

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

    code(code: number) {
        this.addAction(resp => resp.status(code))
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
        this.addAction(resp => resp.contentType(type))
    }

    header(field: string, value: string) {
        this.addAction(resp => resp.header(field, value))
    }
}

export class JsonResult<Resp extends TidyApiOutType | undefined> extends AbstractResult {
    constructor(readonly json: Resp) {
        super()
    }

    protected _end(resp: _TidyUnderlingResponse): void {
        if (this.json)
            resp.json(this.json)
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
        resp.json({
            error: this.error
        })
    }
}

export class TextResult extends BaseResult {
    constructor(readonly text: string) {
        super()
    }

    protected _end(resp: _TidyUnderlingResponse): void {
        resp.send(this.text)
    }
}

export type TidyApiResult<R extends TidyApiType> = TidyApiOutBody<R> | JsonResult<R['out']> | BaseResult
export type TidyApiImplement<R extends TidyApiType> = (input: TidyApiInput<R>) => TidyApiResult<R> | Promise<TidyApiResult<R>>

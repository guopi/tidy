import http from 'http'
import { TidyBaseResponseType, TidyResponseBody } from './types'

export abstract class AbstractResult {
    protected _headers?: http.OutgoingHttpHeaders
    public statusCode?: number
    public statusMessage?: string

    abstract end(resp: http.ServerResponse): void;

    protected _sendHead(resp: http.ServerResponse) {
        resp.statusCode = this.statusCode !== undefined ? this.statusCode : 200

        if (this.statusMessage !== undefined)
            resp.statusMessage = this.statusMessage

        const headers = this._headers
        if (headers !== undefined) {
            for (const name in headers) {
                const value = headers[name]
                if (value !== undefined)
                    resp.setHeader(name, value)
            }
        }
    }

    set type(type: string | undefined) {
        this.header('Content-Type', type)
    }

    get type(): string | undefined {
        const type = this.getStringHeader('Content-Type')
        return type ? type.split(';', 1)[0] : ''
    }

    header(name: string, value: number | string | string[] | undefined): this {
        if (value !== undefined) {
            if (!this._headers)
                this._headers = {}
            this._headers[name] = value
        } else if (this._headers) {
            delete this._headers[name]
        }
        return this
    }

    headers(dict: http.OutgoingHttpHeaders): this {
        if (this._headers)
            Object.assign(this._headers, dict)
        else
            this._headers = { ...dict }
        return this
    }

    removeHeader(name: string) {
        if (this._headers) {
            delete this._headers[name]
        }
        return this
    }

    getHeader(name: string): number | string | string[] | undefined {
        return this._headers
            ? this._headers[name]
            : undefined
    }

    getStringHeader(name: string): string | undefined {
        let value = this.getHeader(name)
        if (Array.isArray(value))
            value = value[0]

        if (value) {
            if (typeof value !== 'string')
                value = value.toString()
            return value
        }
        return undefined
    }
}

export class JsonResult<BODY extends TidyBaseResponseType> extends AbstractResult {
    constructor(private _json: BODY) {
        super()
    }

    end(resp: http.ServerResponse): void {
        this.type = 'application/json'
        this._sendHead(resp)
        resp.end(JSON.stringify(this._json))
    }
}

export abstract class TidyResult extends AbstractResult {
}

export class HeadResult extends TidyResult {
    end(resp: http.ServerResponse): void {
        this._sendHead(resp)
        resp.end()
    }
}

export class TextResult extends TidyResult {
    constructor(private _text: string | undefined) {
        super()
    }

    end(resp: http.ServerResponse): void {
        this.type = 'text/plain'
        this._sendHead(resp)
        resp.end(this._text)
    }
}

export type TidyProcessReturnEntity<RESP extends TidyBaseResponseType = TidyBaseResponseType>
    = TidyResponseBody<RESP> | JsonResult<RESP> | TidyResult | undefined

export type TidyProcessReturnPromise<RESP extends TidyBaseResponseType>
    = Promise<TidyProcessReturnEntity<RESP>>

export type TidyProcessReturn<RESP extends TidyBaseResponseType = TidyBaseResponseType>
    = TidyProcessReturnEntity<RESP> | TidyProcessReturnPromise<RESP>

export type TidyErrorProcessor = (err: any) => TidyProcessReturn<any>

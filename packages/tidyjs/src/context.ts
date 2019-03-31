import { HeadersOf, NamedBoolDict, TidyLogger, TidyRequest } from './types'
import { TidyErrorHandler } from './result'
import typeis from 'type-is'
import http from 'http'

export class TidyContext<REQ = TidyRequest> {
    disables?: NamedBoolDict

    constructor(public _originReq: http.IncomingMessage,
                public req: REQ,
                public onError: TidyErrorHandler,
                public logger: TidyLogger
    ) {
    }

    get url(): string {
        return this._originReq.url!
    }

    get httpVersion(): string {
        return this._originReq.httpVersion!
    }

    get method(): string {
        return this._originReq.method!
    }

    get headers(): HeadersOf<REQ> {
        return (this.req as any).headers
    }

    /**
     * @param types
     * @returns the first `type` that matches or false
     */
    is(...types: string[]): string | false {
        return typeis(this._originReq, types) || false
    }

    disable(key: string, disabled?: boolean): void {
        if (disabled === true) {
            if (!this.disables)
                this.disables = {}
            this.disables[key] = true
        } else if (this.disables) {
            delete this.disables[key]
        }
    }

    disabled(key: string): boolean {
        return this.disables ? !!this.disables[key] : false
    }
}

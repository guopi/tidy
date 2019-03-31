import { NamedBoolDict, PropertyOf } from './types'
import { ErrorBuilder } from './result'
import typeis from 'type-is'
import http from 'http'
import { TidyLogger } from './logger'

export class WebContext<Req> {
    disables?: NamedBoolDict

    constructor(public _originReq: http.IncomingMessage,
                public req: Req,
                public errorBuilder: ErrorBuilder,
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

    get headers(): PropertyOf<Req, 'headers'> {
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

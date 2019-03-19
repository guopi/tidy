import { TidyBaseRequestType } from './types'
import { TidyErrorProcessor } from './result'
import typeis from 'type-is'

export class TidyProcessContext<REQ extends TidyBaseRequestType = TidyBaseRequestType> {
    constructor(public req: REQ, public onError: TidyErrorProcessor) {
    }

    get url(): string {
        return this.req._origin.url!
    }

    get httpVersion(): string {
        return this.req._origin.httpVersion!
    }

    get method(): string {
        return this.req._origin.method!
    }

    get headers(): REQ['headers'] {
        return this.req.headers
    }

    /**
     * @param types
     * @returns the first `type` that matches or false
     */
    is(...types: string[]): string | false {
        return typeis(this.req._origin, types) || false
    }
}

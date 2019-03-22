import http from 'http'
import { AbstractResult, TextResult, TidyProcessReturn, TidyResult } from './result'
import { TidySimpleData } from './types'

export interface TidyHttpError {
    statusCode?: number
    statusMessage?: string
    headers?: http.OutgoingHttpHeaders
    text?: string
}

export function defaultErrorProcessor(err: any): TidyProcessReturn<any> {
    if (undefined == err)
        return undefined

    if (err instanceof AbstractResult)
        return err

    const hError = err as TidyHttpError

    let text: string | undefined = hError.text
    let statusCode: number | undefined
    let statusMessage: string | undefined
    if (typeof hError.statusCode === 'number')
        statusCode = hError.statusCode
    if (typeof hError.statusMessage === 'string')
        statusMessage = hError.statusMessage

    if (err instanceof Error) {
        const msg = err.stack || err.toString()
        console.error()
        console.error(msg)
        console.error()

        if (text === undefined)
            text = msg
    }

    const r = new TextResult(text)
    if (hError.headers)
        r.headers(hError.headers)
    r.statusCode = statusCode || 500
    if (statusMessage)
        r.statusMessage = statusMessage

    return r
}

export class ErrorResult extends TidyResult {
    constructor(private error: TidySimpleData, code?: number) {
        super()
        this.statusCode = code
        this.type = 'application/json'
    }

    sendBody(resp: http.ServerResponse): void {
        resp.write(JSON.stringify({
            error: this.error
        }))
    }
}

export class HttpError extends Error {
}
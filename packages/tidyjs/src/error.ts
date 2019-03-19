import http from 'http'
import { TextResult, TidyProcessReturn } from './result'

export interface TidyHttpError {
    statusCode?: number
    statusMessage?: string
    headers?: http.OutgoingHttpHeaders
    text?: string
}

export function defaultErrorProcessor(err: any): TidyProcessReturn<any> {
    if (null == err)
        return undefined

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
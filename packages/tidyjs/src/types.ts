import http from 'http'
import { TidyProcessReturn } from './result'

export type TidyNonNilSimpleData = boolean | number | string | any[] | {}
export type TidySimpleData = TidyNonNilSimpleData | null | undefined

interface NamedStringDict {
    [name: string]: string
}

interface NamedDict {
    [name: string]: TidySimpleData
}

export interface TidyBaseRequestType extends _Tidy_RequestType {
    _origin: http.IncomingMessage
    headers?: http.IncomingHttpHeaders,
    params?: NamedDict
    query?: NamedDict
    body?: string | {} | TidySimpleData[]
}

export interface TidyBaseResponseType extends _Tidy_ResponseType {
    body?: string | object
    headers?: http.OutgoingHttpHeaders
}

export type TidyResponseBody<R extends TidyBaseResponseType = TidyBaseResponseType> = R extends { body: any } ? R['body'] : undefined


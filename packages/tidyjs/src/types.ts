import http from 'http'
import pino from 'pino'

export type TidyNonNilSimpleData = boolean | number | string | any[] | {}
export type TidySimpleData = TidyNonNilSimpleData | null | undefined

export interface NamedStringDict {
    [name: string]: string
}

export interface NamedBoolDict {
    [name: string]: boolean
}

export interface NamedDict {
    [name: string]: TidySimpleData
}

export interface TidyRequest extends _Tidy_RequestType {
    headers?: http.IncomingHttpHeaders,
    params?: NamedDict
    query?: NamedDict
    body?: string | {} | TidySimpleData[]
}

export interface TidyResponse extends _Tidy_ResponseType {
    body?: string | object
    headers?: http.OutgoingHttpHeaders
}

export type BodyOf<T> = T extends { body: any } ? T['body'] : undefined
export type HeadersOf<T> = T extends { headers: any } ? T['headers'] : undefined

export type TidyLogger = pino.Logger

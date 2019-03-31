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

export interface TidyRequest {
    headers: http.IncomingHttpHeaders,
}

export interface TidyResponse {
    body?: string | object
    headers?: http.OutgoingHttpHeaders
}

export type PropertyOf<T, K> = K extends keyof T ? T[K] : undefined
export type WithProperty<T, K extends keyof any, V>
    = K extends keyof T ? (Pick<T, Exclude<keyof T, K>> & Record<K, V>) : (T & Record<K, V>)

export type TidyLogger = pino.Logger

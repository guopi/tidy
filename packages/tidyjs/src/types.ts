import http from 'http'

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

export interface TidyBaseRequestType extends _Tidy_RequestType {
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


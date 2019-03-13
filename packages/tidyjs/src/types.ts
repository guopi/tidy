type ChooseStrings<KEY> = KEY extends string ? KEY : never

interface String2StringDict {
    [k: string]: string
}

interface StringKeyDict {
    [k: string]: TidySimpleData
}

export type TidySimpleData = boolean | number | string | null | undefined | any[] | {}

export interface TidyApiOutType {
    body?: string | object
    headers?: String2StringDict
}

export interface StdHttpHeaders {
    'accept'?: string;
    'accept-patch'?: string;
    'accept-ranges'?: string;
    'access-control-allow-credentials'?: string;
    'access-control-allow-headers'?: string;
    'access-control-allow-methods'?: string;
    'access-control-allow-origin'?: string;
    'access-control-expose-headers'?: string;
    'access-control-max-age'?: string;
    'age'?: string;
    'allow'?: string;
    'alt-svc'?: string;
    'authorization'?: string;
    'cache-control'?: string;
    'connection'?: string;
    'content-disposition'?: string;
    'content-encoding'?: string;
    'content-language'?: string;
    'content-length'?: string;
    'content-location'?: string;
    'content-range'?: string;
    'content-type'?: string;
    'cookie'?: string;
    'date'?: string;
    'expect'?: string;
    'expires'?: string;
    'forwarded'?: string;
    'from'?: string;
    'host'?: string;
    'if-match'?: string;
    'if-modified-since'?: string;
    'if-none-match'?: string;
    'if-unmodified-since'?: string;
    'last-modified'?: string;
    'location'?: string;
    'pragma'?: string;
    'proxy-authenticate'?: string;
    'proxy-authorization'?: string;
    'public-key-pins'?: string;
    'range'?: string;
    'referer'?: string;
    'retry-after'?: string;
    'set-cookie'?: string[];
    'strict-transport-security'?: string;
    'tk'?: string;
    'trailer'?: string;
    'transfer-encoding'?: string;
    'upgrade'?: string;
    'user-agent'?: string;
    'vary'?: string;
    'via'?: string;
    'warning'?: string;
    'www-authenticate'?: string;
}

export interface TidyApiType extends _TidyApiType {
    headers?: StdHttpHeaders,
    params?: StringKeyDict
    query?: StringKeyDict
    body?: string | {} | TidySimpleData[]
    out?: TidyApiOutType
}

export type TidyOutBodyOf<R extends TidyApiType> = R['out'] extends { body: any } ? R['out']['body'] : undefined

export type TidyApiIn<T extends TidyApiType> = Pick<T, Exclude<keyof T, 'out'>> & {
    _onClean?: () => void
}

export type TidyApiError = string | {}    //todo

export type TidyApiMethod = 'get' | 'post' | 'put' | 'delete' | 'head' | 'options' | 'all'

export interface TidyRouteParamPathSection<T extends string> {
    readonly param: T,
    readonly pattern?: string
}

export interface TidyCompRoutePath<K extends string> {
    readonly parts: ReadonlyArray<string | TidyRouteParamPathSection<K>>
}

export type TidyRoutePath<R extends TidyApiType> = string | TidyCompRoutePath<ChooseStrings<keyof R['params']>>
export type TidyRoutePaths<R extends TidyApiType> = TidyRoutePath<R> | TidyRoutePath<R>[]

export interface TidyApiEntry<R extends TidyApiType> {
    method: TidyApiMethod
    path: TidyRoutePaths<R>
}

export interface TidyServerAppOptions {
    bodyLimit?: number
    useCookie?: boolean
    upload?: {
        fileSizeLimit?: number
        tempDir: string
    }
}

export interface TidyPlugin {
    create?: (app: _TidyUnderlingApp) => void
    prepare?: (req: _TidyUnderlingRequest, input: TidyApiIn<TidyApiType>) => TidyApiIn<TidyApiType>
}

export interface _TidyUnderlingRequest {
    __dummyReq__(): void
}

export interface _TidyUnderlingResponse {
    __dummyResp__(): void
}

export interface _TidyUnderlingApp {
    __dummyApp__(): void
}
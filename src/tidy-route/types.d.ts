interface TidyResponse {
    body?: string | object
    headers?: {
        [k: string]: string
    }
}

type TidyResponseBodyOf<R extends ApiType> = R['resp'] extends undefined ? undefined : R['resp']['body']

interface StdHttpHeaders {
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

interface ApiType {
    headers?: StdHttpHeaders,
    cookies?: {}
    params?: {
        [k: string]: ValidJsonType
    }
    query?: {
        [k: string]: ValidJsonType
    }
    body?: string | {} | ValidJsonType[]
    files?: {
        [k: string]: ValidJsonType
    }
    resp?: TidyResponse
}

type ApiInput<T extends ApiType> = Pick<T, Exclude<keyof T, 'resp'>>

interface ParamPathSection<T extends string> {
    readonly param: T,
    readonly pattern?: string
}

type ValidateSingleError = string | {
    [k: string | number]: ValidateError
}
type ValidateError = ValidateSingleError | ValidateSingleError[]

type ResponseError = any //todo

interface ApiSchema<T extends ApiType> {
    headers?: SchemaDef<T['headers']>
    cookies?: SchemaDef<T['cookies']>
    params?: SchemaDef<T['params']>
    query?: SchemaDef<T['query']>
    body?: SchemaDef<T['body']>
    files?: SchemaDef<T['files']>
}

interface HttpResponse<BODY extends string | object> {
    error?: {
        params?: ValidateError
        query?: ValidateError
        body?: ValidateError
    }
    body?: BODY
    headers?: {
        [k: string]: string
    }
}

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'head' | 'options' | 'all'
type RoutePath<R extends ApiType> = (string | ParamPathSection<keyof R['params']>)[] | string

interface ApiDefine<R extends ApiType> {
    method: HttpMethod
    path: RoutePath<R>
    schema?: ApiSchema<R>
}


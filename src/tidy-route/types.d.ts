interface TidyResponse {
    body?: string | object
    headers?: {
        [k: string]: string
    }
}

type TidyResponseBodyOf<R extends ApiType> = R['resp'] extends undefined ? undefined : R['resp']['body']

interface ApiType {
    headers?: {
        [k: string]: string
    },
    params?: {
        [k: string]: ValidJsonType
    }
    query?: {
        [k: string]: ValidJsonType
    }
    body?: string | {} | ValidJsonType[]
    resp?: TidyResponse
}

type ApiInput<T extends ApiType> = Pick<T, Exclude<keyof T,'resp'>>

interface ParamPathSection<R extends ApiType> {
    readonly param: keyof R['params'],
    readonly pattern?: string
}

type ValidateSingleError = string | {
    [k: string | number]: ValidateError
}
type ValidateError = ValidateSingleError | ValidateSingleError[]

type ResponseError = any //todo

interface ApiSchema<T extends ApiType> {
    headers?: SchemaDef<T['headers']>
    params?: SchemaDef<T['params']>
    query?: SchemaDef<T['query']>
    body?: SchemaDef<T['body']>
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

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'head' | 'options'
type RoutePath<R extends ApiType> = (string | ParamPathSection<R>)[] | string

interface ApiDefine<R extends ApiType> {
    method: HttpMethod
    path: RoutePath<R>
    schema?: ApiSchema<R>
}


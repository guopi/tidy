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
    queryArgs?: {
        [k: string]: ValidJsonType
    }
    body?: string | {} | ValidJsonType[]
    resp?: TidyResponse
}

interface ParamPathSection<RiType> {
    readonly param: keyof R['params'],
    readonly opt?: boolean
}

type ValidateSingleError = string | {
    [k: string | number]: ValidateError
}
type ValidateError = ValidateSingleError | ValidateSingleError[]

type ResponseError = any //todo

interface ValidateResults {
    error?: {
        [k: string]: string[]
    }

    //todo
}

interface ApiSchema<T extends ApiType> {
    headers?: SchemaDef<T['headers']>
    params?: SchemaDef<T['params']>
    queryArgs?: SchemaDef<T['queryArgs']>
    constrains?: ((t: T) => void)[]
    body?: SchemaDef<T['body']>
}

interface HttpResponse<BODY extends string | object> {
    error?: {
        params?: ValidateError
        queryArgs?: ValidateError
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


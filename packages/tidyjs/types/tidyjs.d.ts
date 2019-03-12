namespace tidy {
    type SimpleData = boolean | number | string | null | undefined | any[] | {}

    interface StringKeyDict {
        [k: string]: SimpleData
    }

    interface String2StringDict {
        [k: string]: string
    }

    interface Response {
        body?: string | object
        headers?: String2StringDict
    }

    interface HttpHeaders {
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
        headers?: HttpHeaders,
        cookies?: String2StringDict
        params?: StringKeyDict
        query?: StringKeyDict
        body?: string | {} | SimpleData[]
        files?: {
            [k: string]: SimpleData
        }
        resp?: Response
    }

    type ResponseBodyOf<R extends ApiType> = R['resp'] extends { body: any } ? R['resp']['body'] : undefined

    type ApiInput<T extends ApiType> = Pick<T, Exclude<keyof T, 'resp'>>

    type ResponseError = string | {}    //todo

    type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'head' | 'options' | 'all'

    interface ParamPathSection<T extends string> {
        readonly param: T,
        readonly pattern?: string
    }

    interface CompRoutePath<K extends string> {
        readonly parts: ReadonlyArray<string | ParamPathSection<K>>
    }

    type ChooseStrings<KEY> = KEY extends string ? KEY : never

    type RoutePath<R extends ApiType> = string | CompRoutePath<ChooseStrings<keyof R['params']>>
    type RoutePaths<R extends ApiType> = RoutePath<R> | RoutePath<R>[]

    interface ApiDefine<R extends ApiType> {
        method: HttpMethod
        path: RoutePaths<R>
    }

    interface ServerAppOptions {
        bodyLimit?: number
        useCookie?: boolean
        upload?: {
            fileSizeLimit?: number
            tempDir: string
        }
    }

    interface _Server {

    }
}
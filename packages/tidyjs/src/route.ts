namespace tidy {
    type ValidJsonType = boolean | number | string | null | undefined | any[] | {}

    interface StringKeyDict {
        [k: string]: ValidJsonType
    }

    interface String2StringDict {
        [k: string]: string
    }

    interface TidyResponse {
        body?: string | object
        headers?: String2StringDict
    }

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

    export interface ApiType {
        headers?: StdHttpHeaders,
        cookies?: String2StringDict
        params?: StringKeyDict
        query?: StringKeyDict
        body?: string | {} | ValidJsonType[]
        files?: {
            [k: string]: ValidJsonType
        }
        resp?: TidyResponse
    }

    type TidyResponseBodyOf<R extends ApiType> = R['resp'] extends { body: any } ? R['resp']['body'] : undefined

    type ApiInput<T extends ApiType> = Pick<T, Exclude<keyof T, 'resp'>>

    export interface ParamPathSection<T extends string> {
        readonly param: T,
        readonly pattern?: string
    }

    type ResponseError = string | {}

    export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'head' | 'options' | 'all'

    export interface ICompRoutePath<K extends string> {
        readonly parts: ReadonlyArray<string | ParamPathSection<K>>
    }

    type ChooseStrings<KEY> = KEY extends string ? KEY : never

    export type RoutePath<R extends ApiType> = string | ICompRoutePath<ChooseStrings<keyof R['params']>>
    export type RoutePaths<R extends ApiType> = RoutePath<R> | RoutePath<R>[]

    export interface ApiDefine<R extends ApiType> {
        method: HttpMethod
        path: RoutePaths<R>
    }
}

export function defApi<R extends tidy.ApiType>(method: tidy.HttpMethod, path: tidy.RoutePaths<R>): tidy.ApiDefine<R> {
    return {
        method, path
    }
}

export function pathOf<K extends string>(staticParts: TemplateStringsArray, ...parsableParts: (K | tidy.ParamPathSection<K>)[]): CompRoutePath<K> {
    return new CompRoutePath<K>(staticParts, parsableParts)
}

export class CompRoutePath<K extends string> implements tidy.ICompRoutePath<K> {
    readonly parts: ReadonlyArray<string | tidy.ParamPathSection<K>>

    constructor(staticParts: TemplateStringsArray, parsableParts: (K | tidy.ParamPathSection<K>)[]) {
        const parts: (string | tidy.ParamPathSection<K>)[] = []
        const last = staticParts.length - 1
        for (let i = 0; i < last; i++) {
            const p1 = staticParts[i]
            if (p1)
                parts.push(p1)
            const p2 = parsableParts[i]
            if (p2 !== undefined) {
                parts.push(typeof p2 === 'string' ? { param: p2 } : p2)
            }
        }
        this.parts = parts
    }
}
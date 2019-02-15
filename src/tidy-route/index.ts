export function defApi<R extends ApiType>(method: HttpMethod, path: RoutePath<R>, schema?: ApiSchema<R>): ApiDefine<R> {
    return {
        method, path, schema
    }
}

export function routeParam<T extends string>(name: T, pattern?: string): ParamPathSection<T> {
    return {
        param: name,
        pattern
    }
}
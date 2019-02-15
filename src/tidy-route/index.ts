export function defApi<R extends ApiType>(method: HttpMethod, path: RoutePath<R>, schema?: ApiSchema<R>): ApiDefine<R> {
    return {
        method, path, schema
    }
}

export function routeParam<R extends ApiType>(name: keyof R['params'], pattern?: string): ParamPathSection<R> {
    return {
        param: name,
        pattern
    }
}
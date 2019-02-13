export function defApi<R extends ApiType>(method: HttpMethod, path: RoutePath<R>, schema?: ApiSchema<R>): ApiDefine<R> {
    return {
        method, path, schema
    }
}

export function routeParam<R extends ApiType>(name: keyof R['params'], opt?: boolean): ParamPathSection<R> {
    return {
        param: name,
        opt
    }
}
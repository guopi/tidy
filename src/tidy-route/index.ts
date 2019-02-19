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

export function pathOf<K extends string>(staticParts: TemplateStringsArray, ...parsableParts: (K | ParamPathSection<K>)[]): CompRoutePath<K> {
    return new CompRoutePath<K>(staticParts, parsableParts)
}

export class CompRoutePath<K extends string> implements ICompRoutePath<K> {
    readonly parts: ReadonlyArray<string | ParamPathSection<K>>

    constructor(staticParts: TemplateStringsArray, parsableParts: (K | ParamPathSection<K>)[]) {
        const parts: (string | ParamPathSection<K>)[] = []
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
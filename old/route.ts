import {
    TidyApiEntry,
    TidyApiMethod,
    TidyApiType,
    TidyCompRoutePath,
    TidyRouteParamPathSection,
    TidyRoutePaths
} from './types'

export function defApi<R extends TidyApiType>(method: TidyApiMethod, path: TidyRoutePaths<R>): TidyApiEntry<R> {
    return {
        method, path
    }
}

export function pathOf<K extends string>(staticParts: TemplateStringsArray, ...parsableParts: (K | TidyRouteParamPathSection<K>)[]): SimpleCompRoutePath<K> {
    return new SimpleCompRoutePath<K>(staticParts, parsableParts)
}

class SimpleCompRoutePath<K extends string> implements TidyCompRoutePath<K> {
    readonly parts: ReadonlyArray<string | TidyRouteParamPathSection<K>>

    constructor(staticParts: TemplateStringsArray, parsableParts: (K | TidyRouteParamPathSection<K>)[]) {
        const parts: (string | TidyRouteParamPathSection<K>)[] = []
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
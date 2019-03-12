/// <reference path="../types/tidyjs.d.ts" />

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
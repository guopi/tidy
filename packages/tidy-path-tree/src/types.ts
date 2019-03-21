export interface PathTreeOptions {
    delimiter?: string
    regexCacheSize?: number
    regexCache?: Cache<string, RegExp>
}

export interface PathParams {
    [key: string]: string
}

export interface Cache<K, V> {
    get(key: K): V | undefined

    set(key: K, value: V): V

    clear(): void
}
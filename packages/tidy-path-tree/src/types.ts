export interface PathParams {
    [key: string]: string
}

export interface Cache<K, V> {
    get(key: K): V | undefined

    set(key: K, value: V): V

    clear(): void
}
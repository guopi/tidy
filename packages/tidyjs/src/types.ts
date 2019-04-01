export type TidyNonNilSimpleData = boolean | number | string | any[] | {}
export type TidySimpleData = TidyNonNilSimpleData | null | undefined

export interface NamedStringDict {
    [name: string]: string
}

export interface NamedBoolDict {
    [name: string]: boolean
}

export interface NamedDict {
    [name: string]: TidySimpleData
}

export type PropertyOf<T, K> = K extends keyof T ? T[K] : undefined

export type OrPromise<T> = T | Promise<T>
export type OrArray<T> = T | T[]
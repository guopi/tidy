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

export type WithProperties<T extends {}, Props extends {}> = {
    [P in (keyof T | keyof Props)]: P extends keyof T
        ? (P extends keyof Props ? T[P] | Props[P] : T[P])
        : (P extends keyof Props ? Props[P] : undefined)
}

export type OrPromise<T> = T | Promise<T>

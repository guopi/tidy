export type OptMultiValues<T> = undefined | T | T[]

export type NonNilJsonData = boolean | number | string | any[] | {}
export type JsonData = NonNilJsonData | null | undefined
export type Int = number

export type ErrorPath = string[]

export interface ValidateError {
    message: string
    code: number
    path?: ErrorPath
}

export type WithNewValue<T> = { newValue: T }
export type ValidateResult<T> = undefined | ValidateError[] | WithNewValue<T>

export interface TidySchema<T extends JsonData> {
    typeName(): string

    /**
     * @param originValue
     * @param parentPath
     * @returns undefined : validate successful
     * @returns WithNewValue<T> : value converted
     * @returns ValidateError[] : validate failed
     */
    validate(originValue: any, parentPath: string[] | undefined): ValidateResult<T>

    opt(): TidySchema<T | undefined>

    nullable(): TidySchema<T | null>

    or<T2 extends JsonData>(t2: TidySchema<T2>): TidySchema<T | T2>

    and<T2 extends JsonData>(t2: TidySchema<T2>): TidySchema<T & T2>
}

export type SchemaDictOf<T extends {}> = {
    [K in keyof T]: TidySchema<T[K]>
}
export type SchemaArrayOf<T extends any[]> = {
    [K in keyof T]: TidySchema<T[K]>
}

export type NonUndefinedOf<T> = T extends undefined ? never : T
export type NonNullOf<T> = T extends null ? never : T

export type NonOptKeys<T> = NonUndefinedOf<{
    [K in keyof T]: undefined extends T[K] ? undefined : K
}[keyof T]>

export type OptKeys<T> = NonUndefinedOf<{
    [K in keyof T]: undefined extends T[K] ? K : undefined
}[keyof T]>

type MakeOpt<T> = {
    [K in OptKeys<T>]?: UndefAsOpt<T[K]>
} & {
    [K in NonOptKeys<T>]: UndefAsOpt<T[K]>
}

export type UndefAsOpt<T> = T extends (any[] | boolean | string | number | undefined | null | Symbol | Function)
    ? T : MakeOpt<T>

export type TypeOf<S extends TidySchema<any>> = S extends TidySchema<infer T> ? UndefAsOpt<T> : never

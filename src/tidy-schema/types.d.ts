type ValidJsonType = boolean | number | string | {} | any[] | null | undefined

interface SchemaDef<T extends ValidJsonType> {
    validate(x: any): T

    opt(): SchemaDef<T | undefined>

    nullable(): SchemaDef<T | null>

    or<T2 extends ValidJsonType>(t2: SchemaDef<T2>): SchemaDef<T | T2>

    and<T2 extends ValidJsonType>(t2: SchemaDef<T2>): SchemaDef<T & T2>
}

type SchemaDictOf<T extends {}> = {
    [K in keyof T]: SchemaDef<T[K]>
}
type SchemaArrayOf<T extends any[]> = {
    [K in keyof T]: SchemaDef<T[K]>
}


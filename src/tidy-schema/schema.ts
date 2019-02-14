abstract class BaseType<T extends ValidJsonType> implements SchemaDef<T> {
    opt(): SchemaDef<T | undefined> {
        return new TOptType(this)
    }

    nullable(): SchemaDef<T | null> {
        return new TNullableType(this)
    }

    validate(x: any): T {
        return x
    }

    or<T2 extends ValidJsonType>(t2: SchemaDef<T2>): SchemaDef<T | T2> {
        return new TOrType(this, t2)
    }

    and<T2 extends ValidJsonType>(t2: SchemaDef<T2>): SchemaDef<T & T2> {
        return new TAndType(this, t2)
    }

    should(validator: (v: T) => boolean, message: RuleMessage<T>): this {
        let rules = this.rules
        if (!rules)
            this.rules = rules = []
        rules.push([validator, message])
        return this
    }

    private rules?: TypeRule<T>[]
}

type RuleMessage<T extends ValidJsonType> = string | ((v: T) => string)
type TypeRule<T extends ValidJsonType> = [(v: T) => boolean, RuleMessage<T>]

class TUndefinedType extends BaseType<undefined> {
    opt(): SchemaDef<undefined> {
        return this
    }
}

class TNullType extends BaseType<null> {
    nullable(): SchemaDef<null> {
        return this
    }
}

class TBoolType extends BaseType<boolean> {
    mustBe(b: boolean, message?: RuleMessage<boolean>): this {
        return this.should(
            v => v === b,
            message || `must be ${b}`
        )
    }
}

class TIntType extends BaseType<number> {
    mustBe(values: number[], message?: RuleMessage<number>): this {
        return this.should(
            v => v in values,
            message || (v => `${v} not in ${values}`)
        )
    }

    min(min: number, message?: RuleMessage<number>): this {
        return this.should(
            v => v >= min,
            message || `must >= ${min}`
        )
        return this
    }
}

class TNumberType extends BaseType<number> {
}

class TStringType extends BaseType<string> {
}

class TArrayType<T extends ValidJsonType> extends BaseType<T[]> {
    constructor(readonly item: SchemaDef<T>) {
        super()
    }
}

class TTupleType<Tuple extends ValidJsonType[]> extends BaseType<Tuple> {
    constructor(readonly items: SchemaArrayOf<Tuple>) {
        super()
    }
}

class TObjType<T extends {}> extends BaseType<T> {
    constructor(readonly dict: SchemaDictOf<T>) {
        super()
    }
}

class TNullableType<T extends ValidJsonType> extends BaseType<T | null> {
    constructor(readonly type: SchemaDef<T>) {
        super()
    }
}

class TOptType<T extends ValidJsonType> extends BaseType<T | undefined> {
    constructor(readonly type: SchemaDef<T>) {
        super()
    }

    opt(): this {
        return this
    }
}

class TOrType<T1 extends ValidJsonType, T2 extends ValidJsonType> extends BaseType<T1 | T2> {
    constructor(readonly type1: SchemaDef<T1>, readonly type2: SchemaDef<T2>) {
        super()
    }
}

class TAndType<T1 extends ValidJsonType, T2 extends ValidJsonType> extends BaseType<T1 & T2> {
    constructor(readonly type1: SchemaDef<T1>, readonly type2: SchemaDef<T2>) {
        super()
    }
}

export const jsc = {
    undef(): TUndefinedType {
        return new TUndefinedType()
    },
    null(): TNullType {
        return new TNullType()
    },
    bool(): TBoolType {
        return new TBoolType()
    },
    int(): TIntType {
        return new TIntType()
    },
    num(): TNumberType {
        return new TNumberType()
    },
    str(): TStringType {
        return new TStringType()
    },
    obj<T extends {}>(dict: SchemaDictOf<T>): TObjType<T> {
        return new TObjType(dict)
    },
    arr<T extends ValidJsonType>(itemType: SchemaDef<T>): TArrayType<T> {
        return new TArrayType<T>(itemType)
    },
    tuple<Tuple extends ValidJsonType[]>(...items: SchemaArrayOf<Tuple>) {
        return new TTupleType(items)
    },
}

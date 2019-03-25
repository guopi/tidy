import { ErrorCodes } from './error'
import { Converted, Int, JsonData, SchemaArrayOf, SchemaDictOf, TidySchema, ValidateError } from './types'
import IsEmail from 'isemail'

type RuleMessage<T extends JsonData> = string | ((v: T) => string)

type SchemaRule<T extends JsonData> = (v: T) => ValidateError[] | undefined

export type SchemaAction<T> = (v: T) => T

function addErrorsTo(target: ValidateError[] | undefined, errors: ValidateError[]): ValidateError[] {
    if (!target)
        return errors
    target.push(...errors)
    return target
}

abstract class AbstractSchema<T extends JsonData> implements TidySchema<T> {
    abstract typeName(): string

    abstract validate(originValue: any, parentPath: string[] | undefined): undefined | ValidateError[] | Converted<T>

    protected _typeErrors(x: any, parentPath: string[] | undefined): ValidateError[] {
        return [{
            path: parentPath,
            code: ErrorCodes.ErrorType,
            message: `must be ${this.typeName()}, but ${typeof x.value}`
        }]
    }

    opt(): TidySchema<T | undefined> {
        return new OptSchema(this)
    }

    nullable(): TidySchema<T | null> {
        return new OrNullSchema(this)
    }

    or<T2 extends JsonData>(t2: TidySchema<T2>): TidySchema<T | T2> {
        return new OrSchema(this, t2)
    }

    and<T2 extends JsonData>(t2: TidySchema<T2>): AndSchema<T, T2> {
        return new AndSchema(this, t2)
    }
}

abstract class BaseSchema<T extends JsonData> extends AbstractSchema<T> {
    private _actions?: SchemaAction<T>[]
    private _rules?: SchemaRule<T>[]

    /**
     * @returns true : _checkType successful
     * @returns false : _checkType failed and errors is this._typeErrors(...)
     * @returns Converted<T> : value converted
     * @returns ValidateError[] : _checkType failed
     */
    protected abstract _checkType(x: any): true | false | Converted<T> | ValidateError[]

    protected _convert(x: T): T {
        const actions = this._actions
        if (actions) {
            for (const act of actions) {
                x = act(x)
            }
        }
        return x
    }

    protected _checkRules(originValue: any, value: T, parentPath: string[] | undefined): undefined | Converted<T> | ValidateError[] {
        let errors: ValidateError[] | undefined = undefined
        const rules = this._rules
        if (rules) {
            for (const rule of rules) {
                const r = rule(value)
                if (r) {
                    prependParent(r, parentPath)
                    errors = addErrorsTo(errors, r)
                }
            }
        }
        if (errors)
            return errors
        return value !== originValue ? new Converted(value) : undefined
    }

    validate(originValue: any, parentPath: string[] | undefined): undefined | ValidateError[] | Converted<T> {
        const typeResult = this._checkType(originValue)
        let converted: T
        if (typeResult === true) {
            converted = originValue as any
        } else if (typeResult === false) {
            return this._typeErrors(originValue, parentPath)
        } else if (typeResult instanceof Converted) {
            converted = typeResult.value
        } else {
            // ValidateError[]
            return typeResult
        }

        converted = this._convert(converted)
        return this._checkRules(originValue, converted, parentPath)
    }

    must(rule: SchemaRule<T>): this {
        if (!this._rules)
            this._rules = []
        this._rules.push(rule)
        return this
    }

    action(action: SchemaAction<T>): this {
        if (!this._actions) this._actions = []
        this._actions.push(action)
        return this
    }
}

class UndefinedSchema extends AbstractSchema<undefined> {
    typeName(): string {
        return 'undefined'
    }

    opt(): this {
        return this
    }

    validate(originValue: any, parentPath: string[] | undefined): ValidateError[] | Converted<undefined> | undefined {
        return originValue !== undefined ? undefined : this._typeErrors(originValue, parentPath)
    }
}

class NullSchema extends AbstractSchema<null> {
    typeName(): string {
        return 'null'
    }

    nullable(): this {
        return this
    }

    validate(originValue: any, parentPath: string[] | undefined): ValidateError[] | Converted<null> | undefined {
        return originValue !== null ? undefined : this._typeErrors(originValue, parentPath)
    }
}

abstract class SingleValueSchema<T extends boolean | number | string> extends BaseSchema<T> {
    anyOf(values: T[], message?: RuleMessage<T>): this {
        return this.must(v =>
            values.indexOf(v) >= 0
                ? undefined
                : [{
                    message: makeMessage(v, message) || `must one of [${values}]`,
                    code: ErrorCodes.ErrorValue
                }]
        )
    }

    notAny(values: T[], message?: RuleMessage<T>): this {
        return this.must(v =>
            values.indexOf(v) < 0
                ? undefined
                : [{
                    message: makeMessage(v, message) || `must not one of [${values}]`,
                    code: ErrorCodes.ErrorValue
                }]
        )
    }

    exact(value: T, message?: RuleMessage<T>): this {
        return this.must(v =>
            v === value
                ? undefined
                : [{
                    message: makeMessage(v, message) || `must exact === ${value}`,
                    code: ErrorCodes.ErrorValue
                }]
        )
    }

    not(value: T, message?: RuleMessage<T>): this {
        return this.must(v =>
            v !== value
                ? undefined
                : [{
                    message: makeMessage(v, message) || `must not ${value}`,
                    code: ErrorCodes.ErrorValue
                }]
        )
    }
}

class BoolSchema extends SingleValueSchema<boolean> {
    typeName(): string {
        return 'boolean'
    }

    _checkType(x: any): true | false | Converted<boolean> | ValidateError[] {
        switch (typeof x) {
            case 'boolean':
                return true
            case 'number':
                return new Converted(x !== 0)
            case 'string':
                switch (x.toLowerCase()) {
                    case 'true':
                    case 'yes':
                    case 'on':
                    case '1':
                        return new Converted(true)

                    case 'false':
                    case 'no':
                    case 'off':
                    case '0':
                        return new Converted(false)
                }
        }
        return false
    }
}

class NumberSchema extends SingleValueSchema<number> {
    typeName(): string {
        return 'number'
    }

    _checkType(x: any): true | false | Converted<number> | ValidateError[] {
        switch (typeof x) {
            case 'number':
                return true
            case 'string':
                if (!isNaN(x as any))
                    return new Converted(Number(x))
        }
        return false
    }

    min(min: number, message?: RuleMessage<number>): this {
        return this.must(v =>
            v >= min
                ? undefined
                : [{
                    message: makeMessage(v, message) || `must >= ${min}`,
                    code: ErrorCodes.ErrorValue
                }]
        )
    }

    max(max: number, message?: RuleMessage<number>): this {
        return this.must(v =>
            v <= max
                ? undefined
                : [{
                    message: makeMessage(v, message) || `must <= ${max}`,
                    code: ErrorCodes.ErrorValue
                }]
        )
    }

    gt(min: number, message?: RuleMessage<number>): this {
        return this.must(v => v > min
            ? undefined
            : [{
                message: makeMessage(v, message) || `must > ${min}`,
                code: ErrorCodes.ErrorValue
            }]
        )
    }

    lt(max: number, message?: RuleMessage<number>): this {
        return this.must(v =>
            v < max
                ? undefined
                : [{
                    message: makeMessage(v, message) || `must < ${max}`,
                    code: ErrorCodes.ErrorValue
                }]
        )
    }
}

class IntSchema extends NumberSchema {
    typeName(): string {
        return 'integer'
    }

    _checkType(x: any): true | false | Converted<number> | ValidateError[] {
        switch (typeof x) {
            case 'number':
                return Number.isInteger(x)
            case 'string':
                if (!isNaN(x as any)) {
                    const i = Number(x)
                    if (Number.isInteger(i))
                        return new Converted(i)
                }
        }
        return false
    }
}

class StringSchema extends SingleValueSchema<string> {
    typeName(): string {
        return 'string'
    }

    _checkType(x: any): true | false | Converted<string> | ValidateError[] {
        if (typeof x === 'string')
            return true
        if (x != null) // not null & not undefined
            return new Converted(x.toString())
        return false
    }

    maxLen(max: Int, message?: RuleMessage<string>): this {
        return this.must(v =>
            v.length <= max
                ? undefined
                : [{
                    message: makeMessage(v, message) || `length must <= ${max}`,
                    code: ErrorCodes.ErrorValue
                }]
        )
    }

    minLen(min: Int, message?: RuleMessage<string>): this {
        return this.must(v =>
            v.length >= min
                ? undefined
                : [{
                    message: makeMessage(v, message) || `length must >= ${min}`,
                    code: ErrorCodes.ErrorValue
                }]
        )
    }

    match(regex: string | RegExp, message?: RuleMessage<string>) {
        const re: RegExp = typeof regex === 'string' ? RegExp(regex) : regex

        return this.must(v =>
            re.test(v)
                ? undefined
                : [{
                    message: makeMessage(v, message) || `must match ${re}`,
                    code: ErrorCodes.ErrorValue
                }]
        )
    }

    startsWith(prefix: string, message?: RuleMessage<string>): this {
        return this.must(v =>
            v.startsWith(prefix)
                ? undefined
                : [{
                    message: makeMessage(v, message) || `must startsWith "${prefix}"`,
                    code: ErrorCodes.ErrorValue
                }]
        )
    }

    endsWith(postfix: string, message?: RuleMessage<string>): this {
        return this.must(v =>
            v.endsWith(postfix)
                ? undefined
                : [{
                    message: makeMessage(v, message) || `must endsWith "${postfix}"`,
                    code: ErrorCodes.ErrorValue
                }]
        )
    }

    isEmail(message?: RuleMessage<string>): this {
        return this.must(v =>
            IsEmail.validate(v)
                ? undefined
                : [{
                    message: makeMessage(v, message) || `must be email`,
                    code: ErrorCodes.ErrorValue
                }]
        )
    }

    /*
    uuid(versions: (1 | 2 | 3 | 4 | 5)[] | undefined, message?: RuleMessage<string>): this {
    }
    url(schemes: string[] | undefined, message?: RuleMessage<string>): this {
    }
    */

    trim(): this {
        return this.action(v => v.trim())
    }

    toUpperCase(): this {
        return this.action(v => v.toUpperCase())
    }

    toLowerCase(): this {
        return this.action(v => v.toLowerCase())
    }

    truncate(max: Int): this {
        return this.action(v => v.length > max ? v.substring(0, max) : v)
    }
}

function joinPath(parent: string | number | undefined, path: string | number): string {
    return parent === undefined ? path.toString() : `${parent}.${path}`
}

class ArraySchema<T extends JsonData> extends BaseSchema<T[]> {
    constructor(readonly item: TidySchema<T>) {
        super()

        this.must(arr => {
            const itemType = this.item
            let errors: ValidateError[] | undefined

            const n = arr.length
            for (let i = 0; i < n; i++) {
                const r = itemType.validate(arr[i], [i.toString()])
                if (r !== undefined) {
                    if (r instanceof Converted) {
                        arr[i] = r.value
                    } else {
                        errors = addErrorsTo(errors, r)
                    }
                }
            }
            return errors
        })
    }

    typeName(): string {
        return `array<${this.item.typeName()}>`
    }

    _checkType(x: any): boolean {
        return Array.isArray(x)
    }

    maxLen(max: Int, message?: RuleMessage<T[]>): this {
        return this.must(v =>
            v.length <= max
                ? undefined
                : [{
                    message: makeMessage(v, message) || `array length must <= ${max}`,
                    code: ErrorCodes.ErrorValue
                }]
        )
    }

    minLen(min: Int, message?: RuleMessage<T[]>): this {
        return this.must(v =>
            v.length >= min
                ? undefined
                : [{
                    message: makeMessage(v, message) || `array length must >= ${min}`,
                    code: ErrorCodes.ErrorValue
                }]
        )
    }

    unique(idExtractor?: (v: T) => any, message?: RuleMessage<T[]>): this {
        return this.must(
            arr => {
                const idSet = new Set()
                for (const v of arr) {
                    const id = idExtractor ? idExtractor(v) : v
                    if (idSet.has(id))
                        return [{
                            message: makeMessage(arr, message) || `array items is not unique`,
                            code: ErrorCodes.ErrorValue
                        }]
                    idSet.add(id)
                }
                return undefined
            }
        )
    }

}

class TupleSchema<Tuple extends JsonData[]> extends BaseSchema<Tuple> {
    constructor(readonly items: SchemaArrayOf<Tuple>) {
        super()

        this.must(tuple => {
            const n = tuple.length
            let errors: ValidateError[] | undefined
            for (let i = 0; i < n; i++) {
                const r = this.items[i].validate(tuple[i], [i.toString()])
                if (r !== undefined) {
                    if (r instanceof Converted)
                        tuple[i] = r.value
                    else
                        errors = addErrorsTo(errors, r)
                }
            }
            return errors
        })
    }

    _checkType(x: any): boolean {
        return Array.isArray(x) && x.length <= this.items.length
    }

    typeName(): string {
        return `tuple<${this.items.map(t => t.typeName()).join()}>`
    }
}

class ObjSchema<T extends {}> extends BaseSchema<T> {
    constructor(readonly dict: SchemaDictOf<T>) {
        super()
        this.must(obj => {
            let errors: ValidateError[] | undefined
            for (const k in this.dict) {
                const r = this.dict[k].validate(obj[k], [k])
                if (r !== undefined) {
                    if (r instanceof Converted)
                        obj[k] = r.value
                    else
                        errors = addErrorsTo(errors, r)
                }
            }

            return errors
        })
    }

    typeName(): string {
        return 'object'
    }

    _checkType(x: any): boolean {
        return typeof x === 'object' && !Array.isArray(x)
    }
}

class OrNullSchema<T extends JsonData> extends AbstractSchema<T | null> {
    constructor(readonly type: TidySchema<T>) {
        super()
    }

    typeName(): string {
        return this.type.typeName() + ' | null'
    }

    validate(originValue: any, parentPath: string[] | undefined): ValidateError[] | Converted<T> | undefined {
        if (originValue === null)
            return undefined
        return this.type.validate(originValue, parentPath)
    }
}

class OptSchema<T extends JsonData> extends AbstractSchema<T | undefined> {
    typeName(): string {
        return this.type.typeName() + ' | undefined'
    }

    constructor(readonly type: TidySchema<T>) {
        super()
    }

    opt(): this {
        return this
    }

    validate(originValue: any, parentPath: string[] | undefined): ValidateError[] | Converted<T> | undefined {
        if (originValue === undefined)
            return undefined
        return this.type.validate(originValue, parentPath)
    }
}

class OrSchema<T1 extends JsonData, T2 extends JsonData> extends AbstractSchema<T1 | T2> {
    constructor(readonly type1: TidySchema<T1>, readonly type2: TidySchema<T2>) {
        super()
    }

    typeName(): string {
        return `( ${this.type1.typeName()} | ${this.type2.typeName()})`
    }

    validate(originValue: any, parentPath: string[] | undefined): ValidateError[] | Converted<T1 | T2> | undefined {
        const r1 = this.type1.validate(originValue, parentPath)
        if (r1 === undefined || r1 instanceof Converted)
            return r1

        const r2 = this.type2.validate(originValue, parentPath)
        if (r2 === undefined || r2 instanceof Converted)
            return r2

        r1.push(...r2)
        return r1
    }
}

class AndSchema<T1 extends JsonData, T2 extends JsonData> extends AbstractSchema<T1 & T2> {
    constructor(readonly type1: TidySchema<T1>, readonly type2: TidySchema<T2>) {
        super()
    }

    typeName(): string {
        return `${this.type1.typeName()} & ${this.type2.typeName()}`
    }

    validate(originValue: any, parentPath: string[] | undefined): ValidateError[] | Converted<T1 & T2> | undefined {
        const r1 = this.type1.validate(originValue, parentPath)
        let converted = originValue
        let errors: ValidateError[] | undefined
        if (r1 === undefined) {
        } else if (r1 instanceof Converted) {
            converted = r1.value
        } else {
            errors = r1
        }

        const r2 = this.type2.validate(converted, parentPath)
        if (r2 === undefined) {
        } else if (r2 instanceof Converted) {
            converted = r2.value
        } else {
            errors = addErrorsTo(errors, r2)
        }

        return errors || (converted !== originValue ? new Converted(converted) : undefined)
    }
}

class AnySchema implements TidySchema<any> {
    and<T2 extends JsonData>(t2: TidySchema<T2>): TidySchema<T2> {
        return t2
    }

    nullable(): this {
        return this
    }

    opt(): this {
        return this
    }

    or<T2 extends JsonData>(t2: TidySchema<T2>): this {
        return this
    }

    typeName(): string {
        return 'any'
    }

    validate(value: any, parentPath: string[] | undefined): Converted<any> | ValidateError[] | undefined {
        return undefined
    }
}

export const tjs = {
    any(): AnySchema {
        return new AnySchema()
    },
    undef(): UndefinedSchema {
        return new UndefinedSchema()
    },
    null(): NullSchema {
        return new NullSchema()
    },
    bool(): BoolSchema {
        return new BoolSchema()
    },
    int(): IntSchema {
        return new IntSchema()
    },
    num(): NumberSchema {
        return new NumberSchema()
    },
    str(): StringSchema {
        return new StringSchema()
    },
    obj<T extends {}>(dict: SchemaDictOf<T>): ObjSchema<T> {
        return new ObjSchema(dict)
    },
    arr<T extends JsonData>(itemType: TidySchema<T>): ArraySchema<T> {
        return new ArraySchema<T>(itemType)
    },
    tuple<Tuple extends JsonData[]>(...items: SchemaArrayOf<Tuple>) {
        return new TupleSchema(items)
    },
}

function prependParent(errors: ValidateError[], parentPath: string[] | undefined) {
    if (parentPath) {
        for (const e of errors) {
            e.path = e.path ? [...parentPath, ...e.path] : [...parentPath]
        }
    }
}

function makeMessage<T>(v: T, message: RuleMessage<T> | undefined): string | undefined {
    return message && (
        typeof message === 'string'
            ? message
            : message(v)
    )
}
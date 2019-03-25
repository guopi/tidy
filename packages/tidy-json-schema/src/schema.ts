import { ErrorCodes } from './error'
import {
    Int,
    JsonData,
    SchemaArrayOf,
    SchemaDictOf,
    TidySchema,
    ValidateError,
    ValidateResult,
    WithNewValue
} from './types'
import IsEmail from 'isemail'

export type RuleMessage<T extends JsonData> = string | ((v: T) => string)

export type SchemaRule<T extends JsonData> = (v: T) => undefined | ValidateError | ValidateError[]

export type SchemaAction<T> = (v: T) => T

function addErrorsTo(target: ValidateError[] | undefined, errors: ValidateError | ValidateError[]): ValidateError[] {
    if (Array.isArray(errors)) {
        if (!target)
            return errors

        target.push(...errors)
        return target
    } else {
        if (!target)
            return [errors]

        target.push(errors)
        return target
    }
}

abstract class AbstractSchema<T extends JsonData> implements TidySchema<T> {
    abstract typeName(): string

    isOpt(): boolean {
        return false
    }

    abstract validate(value: any, parentPath: string[] | undefined): ValidateResult<T>

    protected _typeErrors(value: any, parentPath: string[] | undefined): ValidateError[] {
        return [{
            path: parentPath,
            code: ErrorCodes.ErrorType,
            message: `must be ${this.typeName()}, but ${typeof value}`
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

export function isNewValue<T>(result: ValidateResult<T>): result is WithNewValue<T> {
    return result !== undefined && !Array.isArray(result)
}

export function isErrors<T>(result: ValidateResult<T>): result is ValidateError[] {
    return Array.isArray(result)
}

abstract class BaseSchema<T extends JsonData> extends AbstractSchema<T> {
    private _actions?: SchemaAction<T>[]
    private _rules?: SchemaRule<T>[]

    /**
     * @returns {false} : _checkType failed and errors is this._typeErrors(...)
     * @returns {undefined} : _checkType successful
     * @returns {WithNewValue<T>} : successful and new value converted
     * @returns {ValidateError[]} : _checkType failed
     */
    protected abstract _checkType(x: any): false | ValidateResult<T>

    protected _convert(value: T): T {
        const actions = this._actions
        if (actions) {
            for (const act of actions) {
                value = act(value)
            }
        }
        return value
    }

    protected _checkRules(value: T, parentPath: string[] | undefined): ValidateError[] | undefined {
        let errors: ValidateError[] | undefined = undefined
        const rules = this._rules
        if (rules) {
            for (const rule of rules) {
                const r = rule(value)
                if (r) {
                    prependParentToErrors(r, parentPath)
                    errors = addErrorsTo(errors, r)
                }
            }
        }
        return errors
    }

    validate(value: any, parentPath: string[] | undefined): ValidateResult<T> {
        const typeResult = this._checkType(value)
        let newValue: T
        if (typeResult === undefined) {
            newValue = value as any
        } else if (typeResult === false) {
            return this._typeErrors(value, parentPath)
        } else if (isNewValue(typeResult)) {
            newValue = typeResult.newValue
        } else {
            return typeResult
        }

        newValue = this._convert(newValue)
        const errors = this._checkRules(newValue, parentPath)
        if (errors)
            return errors
        return newValue === value ? undefined : { newValue }
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

    isOpt(): boolean {
        return true
    }

    opt(): this {
        return this
    }

    validate(value: any, parentPath: string[] | undefined): ValidateResult<undefined> | undefined {
        return value !== undefined ? undefined : this._typeErrors(value, parentPath)
    }
}

class NullSchema extends AbstractSchema<null> {
    typeName(): string {
        return 'null'
    }

    nullable(): this {
        return this
    }

    validate(value: any, parentPath: string[] | undefined): ValidateResult<null> | undefined {
        return value !== null ? undefined : this._typeErrors(value, parentPath)
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

    protected _checkType(x: any): false | ValidateResult<boolean> {
        switch (typeof x) {
            case 'boolean':
                return undefined
            case 'number':
                return { newValue: x !== 0 }
            case 'string':
                switch (x.toLowerCase()) {
                    case 'true':
                    case 'yes':
                    case 'on':
                    case '1':
                        return { newValue: true }

                    case 'false':
                    case 'no':
                    case 'off':
                    case '0':
                        return { newValue: false }
                }
        }
        return false
    }
}

class NumberSchema extends SingleValueSchema<number> {
    typeName(): string {
        return 'number'
    }

    _checkType(x: any): false | ValidateResult<number> {
        switch (typeof x) {
            case 'number':
                return undefined
            case 'string':
                if (!isNaN(x as any))
                    return { newValue: Number(x) }
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
        return 'Int'
    }

    _checkType(x: any): false | ValidateResult<Int> {
        switch (typeof x) {
            case 'number':
                return Number.isInteger(x) ? undefined : false
            case 'string':
                if (!isNaN(x as any)) {
                    const i = Number(x)
                    if (Number.isInteger(i))
                        return { newValue: i }
                }
        }
        return false
    }
}

class StringSchema extends SingleValueSchema<string> {
    typeName(): string {
        return 'string'
    }

    _checkType(x: any): false | ValidateResult<string> {
        if (typeof x === 'string')
            return undefined
        if (x != null) // not null & not undefined
            return { newValue: x.toString() }
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
                    if (isNewValue(r)) {
                        arr[i] = r.newValue
                    } else {
                        errors = addErrorsTo(errors, r)
                    }
                }
            }
            return errors
        })
    }

    typeName(): string {
        return `Array<${this.item.typeName()}>`
    }

    _checkType(x: any): undefined | false {
        return Array.isArray(x) ? undefined : false
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
                    if (isNewValue(r))
                        tuple[i] = r.newValue
                    else
                        errors = addErrorsTo(errors, r)
                }
            }
            return errors
        })
    }

    _checkType(x: any): false | undefined {
        return Array.isArray(x) && x.length <= this.items.length
            ? undefined : false
    }

    typeName(): string {
        return `[ ${this.items.map(t => t.typeName()).join(', ')} ]`
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
                    if (isNewValue(r))
                        obj[k] = r.newValue
                    else
                        errors = addErrorsTo(errors, r)
                }
            }

            return errors
        })
    }

    typeName(): string {
        return `{ ${Object.keys(this.dict).map(
            k => {
                const type = (this.dict as SchemaDictOf<any>)[k]
                return `${k}${type.isOpt() ? '?' : ''}: ${type.typeName()}; `
            }
        ).join('')}}`
    }

    _checkType(x: any): false | undefined {
        return typeof x === 'object' && !Array.isArray(x)
            ? undefined : false
    }
}

class OrNullSchema<T extends JsonData> extends AbstractSchema<T | null> {
    constructor(readonly type: TidySchema<T>) {
        super()
    }

    typeName(): string {
        return this.type.typeName() + ' | null'
    }

    validate(originValue: any, parentPath: string[] | undefined): ValidateResult<T> {
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

    isOpt(): boolean {
        return true
    }

    opt(): this {
        return this
    }

    validate(originValue: any, parentPath: string[] | undefined): ValidateResult<T> {
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

    validate(originValue: any, parentPath: string[] | undefined): ValidateResult<T1 | T2> {
        const r1 = this.type1.validate(originValue, parentPath)
        if (r1 === undefined || isNewValue(r1))
            return r1

        const r2 = this.type2.validate(originValue, parentPath)
        if (r2 === undefined || isNewValue(r2))
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

    validate(value: any, parentPath: string[] | undefined): ValidateResult<T1 & T2> {
        const r1 = this.type1.validate(value, parentPath)
        let newValue = value
        let errors: ValidateError[] | undefined
        if (r1 === undefined) {
        } else if (isNewValue(r1)) {
            newValue = r1.newValue
        } else {
            errors = r1
        }

        const r2 = this.type2.validate(newValue, parentPath)
        if (r2 === undefined) {
        } else if (isNewValue(r2)) {
            newValue = r2.newValue
        } else {
            errors = addErrorsTo(errors, r2)
        }

        return errors || (newValue === value ? undefined : { newValue })
    }
}

class AnySchema implements TidySchema<any> {
    and<T2 extends JsonData>(t2: TidySchema<T2>): TidySchema<T2> {
        return t2
    }

    nullable(): this {
        return this
    }

    isOpt(): boolean {
        return true
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

    validate(value: any, parentPath: string[] | undefined): ValidateResult<any> {
        return undefined
    }
}

function prependParentToErrors(errors: ValidateError | ValidateError[], parentPath: string[] | undefined) {
    if (parentPath) {
        if (Array.isArray(errors)) {
            for (const e of errors) {
                e.path = e.path ? [...parentPath, ...e.path] : [...parentPath]
            }
        } else {
            prependParentToError(errors, parentPath)
        }
    }
}

function prependParentToError(error: ValidateError, parentPath: string[]) {
    error.path = error.path ? [...parentPath, ...error.path] : [...parentPath]
}

function makeMessage<T>(v: T, message: RuleMessage<T> | undefined): string | undefined {
    return message && (
        typeof message === 'string'
            ? message
            : message(v)
    )
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

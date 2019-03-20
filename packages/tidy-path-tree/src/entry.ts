import { EntryData, Params } from './types'
import { Segment } from './lexer'
import { SimpleCache } from './cache'

export interface EntryAddContext {
    unnamedCapture: number
    readonly regexCache: SimpleCache<string, RegExp>
}

export interface EntryFindContext {
    length: number;
    pathes: string[];
    params: Params;
    lastDelimiter: boolean
}

export interface EntryPattern<DATA extends EntryData> {
    key: string
    regexp: RegExp
    names: (string | number)[]
    raw?: string
    slots: number[]
    route: DynamicEntry<DATA>
}

export class DynamicEntry<DATA extends EntryData> {
    touched?: boolean
    data?: DATA
    prefix?: boolean
    strict?: boolean
    staticMap: { [staticText: string]: DynamicEntry<DATA> } = {}

    patterns: EntryPattern<DATA>[] = []
    leadOptionalRoute?: DynamicEntry<DATA>

    addStatic(staticText: string): DynamicEntry<DATA> {
        const cur = this.staticMap[staticText]
        if (cur)
            return cur
        const entry = new DynamicEntry<DATA>()
        this.staticMap[staticText] = entry
        return entry
    }

    addPattern(tokenObj: Segment, context: EntryAddContext): DynamicEntry<DATA> {
        let ret = ''

        let captureIndex = 1
        let tokens = tokenObj.tokens
        let unnamedCapture = context.unnamedCapture
        let names: (string | number)[] = []
        let slots: number[] = []
        let anonymousCapture = 0
        let raw = tokenObj.raw
        const regExpCache = context.regexCache

        for (const token of tokens) {
            if (typeof token === 'string') {
                ret += _escapeRegexp(token)
            } else {
                slots.push(captureIndex)
                names.push(token.name ? token.name : unnamedCapture + anonymousCapture++)

                captureIndex += token.retain
                ret += '(' + token.value + ')' + (token.optional ? '?' : '')
            }
        }

        let path = '^' + ret + '$'

        context.unnamedCapture += anonymousCapture

        const reg = regExpCache.get(path) || regExpCache.set(path, new RegExp(path))

        const patterns = this.patterns

        let pattern = findPattern(patterns, path)

        if (pattern) {
            if (!sameArray(pattern.names, names)) {
                throw Error('named Capture conflict ' + raw + ' -> ' + pattern.raw)
            }
            return pattern.route
        }

        let leadOptional = false
        if (tokens.length === 1) {
            const first = tokens[0]
            if (typeof first !== 'string' && first.optional)
                leadOptional = true
        }

        pattern = {
            key: path,
            regexp: reg,
            raw,
            slots,
            names,
            route: new DynamicEntry<DATA>()
        }

        if (leadOptional) {
            this.leadOptionalRoute = pattern.route
        }

        patterns.push(pattern)

        return pattern.route
    }

    find(index: number, context: EntryFindContext): DynamicEntry<DATA> | undefined {
        const found = this.findStatic(index, context)
        if (found)
            return found
        return this.findDynamic(index, context)
    }

    findStatic(index: number, context: EntryFindContext): DynamicEntry<DATA> | undefined {

        const path = context.pathes[index]

        const staticMap = this.staticMap

        const found = staticMap[path]

        if (found) {
            const isLast = index === context.length - 1

            // if absolute match or  the route has end === false option
            if (isLast) { // need registed
                if (found.touched) {
                    return found
                }

                // /blog/:id?  + strict  vs  /blog
                if (found.leadOptionalRoute && found.leadOptionalRoute.strict === false) {
                    return found.leadOptionalRoute
                }

                return undefined

            }

            let childFound = found.find(index + 1, context)
            if (childFound)
                return childFound

            // end means touched
            if (found.prefix)
                return found
        }
    }

    findDynamic(index: number, context: EntryFindContext): DynamicEntry<DATA> | undefined {
        const path = context.pathes[index]
        const patterns = this.patterns
        const isLast = context.length - 1 === index

        if (!patterns.length)
            return undefined

        for (const pattern of patterns) {
            if (!pattern)
                continue

            let regexp = pattern.regexp
            // use test for better performance
            let ret = regexp.exec(path)

            if (ret) {
                let nextRoute = pattern.route

                if (isLast) {
                    if (!nextRoute.touched) {

                        if (nextRoute.leadOptionalRoute && nextRoute.leadOptionalRoute.strict === false) {
                            return nextRoute.leadOptionalRoute
                        }
                        return undefined
                    }
                    buildParam(ret, pattern.slots, pattern.names, context.params)

                    return nextRoute
                }

                let nextFound = nextRoute.find(index + 1, context)

                if (nextFound || nextRoute.prefix) {
                    buildParam(ret, pattern.slots, pattern.names, context.params)
                    return nextFound ? nextFound : nextRoute
                }

            }

        }

    }
}

function buildParam(execRet: RegExpExecArray, slots: number[], names: (string | number)[], params: Params) {
    for (let i = 0, len = names.length; i < len; i++) {
        const name = names[i]
        params[name] = execRet[slots[i]]
    }
}

const _RE_ESCAPE = /([.+*?=^!:${}()[\]|/\\])/g

function _escapeRegexp(str: string) {
    return str.replace(_RE_ESCAPE, '\\$1')
}

function findPattern<D extends EntryData>(patterns: EntryPattern<D>[], path: string): EntryPattern<D> | undefined {
    for (const p of patterns) {
        if (p.key === path)
            return p
    }
}

function sameArray<T>(arr1: T[], arr2: T[]): boolean {
    const len = arr1.length
    if (len !== arr2.length)
        return false

    for (let i = 0; i < len; i++) {
        if (arr1[i] !== arr2[i])
            return false
    }
    return true
}

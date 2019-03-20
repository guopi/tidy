import { EntryData, Params, PathTreeOptions } from './types'
import { Lexer } from './lexer'
import { DynamicEntry, EntryAddContext } from './entry'
import { PathError } from './error'
import { SimpleCache } from './cache'

export * from './types'

interface EntryOptions {
    strict?: boolean    // default true
    prefix?: boolean    // default false
}

const _RE_WithDynamic = /[:(]/
const _RE_Clean = /^\/+|\/+$/

export interface FindResult<DATA extends EntryData> {
    params: Params
    data: DATA
}

export class PathTree<DATA extends EntryData> {
    private _opts: PathTreeOptions
    private _staticEntries: {
        [path: string]: DATA
    } = {}
    private _dynamicEntry = new DynamicEntry<DATA>()
    private readonly _regexCache: SimpleCache<string, RegExp>
    private _delimiter: string

    constructor(opts?: PathTreeOptions) {
        this._opts = opts || {}
        this._regexCache = new SimpleCache(opts && opts.regexCacheSize)
        this._delimiter = this._opts.delimiter || '/'
    }

    cleanup() {
        this._regexCache.clear()
    }

    add(data: DATA, opts?: EntryOptions): void {
        const path = data.path
        const prefix = opts && opts.prefix
        const strict = opts && opts.strict

        if (!prefix && !(_RE_WithDynamic.test(path))) {
            if (this._staticEntries[path] !== undefined)
                throw new Error(`path ${path} is already added`)
            this._staticEntries[path] = data
            return
        }

        let curEntry = this._dynamicEntry
        let context: EntryAddContext = {
            unnamedCapture: 0,
            regexCache: this._regexCache
        }

        const segments = new Lexer(path, this._delimiter).parse()
        for (const seg of segments) {
            if (seg.pattern) {
                curEntry = curEntry.addPattern(seg, context)
            } else {
                curEntry = curEntry.addStatic(seg.tokens.join())
            }
        }

        if (curEntry.touched)
            throw new PathError(`path ${path} is already added`)

        curEntry.touched = true
        curEntry.data = data
        curEntry.prefix = prefix
        curEntry.strict = strict !== false
    }

    find(path: string): FindResult<DATA> | undefined {
        const params: Params = {}

        const found = this._staticEntries[path]
        if (found) {
            return {
                params,
                data: found
            }
        }

        const delimiter = this._delimiter

        const lastDelimiter = path.charAt(path.length - 1) === delimiter
        const pathes = path.replace(_RE_Clean, '').split(delimiter)

        const route = this._dynamicEntry.find(0, {
            length: pathes.length,
            pathes,
            params: params,
            lastDelimiter
        })

        if (!route)
            return undefined

        return {
            params,
            data: route.data!
        }
    }
}
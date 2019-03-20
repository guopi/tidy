import { PathParams, PathTreeOptions } from './types'
import { Lexer } from './lexer'
import { AddContext, Layer } from './layer'
import { PathError } from './error'
import { SimpleCache } from './cache'

export * from './types'

interface EntryOptions {
    strict?: boolean    // default true
    prefix?: boolean    // default false
}

const _RE_HasDynamic = /[:(]/

export interface FindResult<DATA> {
    params: PathParams
    data: DATA
}

export class PathTree<DATA> {
    private _opts: PathTreeOptions
    private _statics: {
        [path: string]: DATA
    } = {}
    private _root = new Layer<DATA>()
    private readonly _regexCache: SimpleCache<string, RegExp>
    private readonly _delimiter: string

    constructor(opts?: PathTreeOptions) {
        this._opts = opts || {}
        this._regexCache = new SimpleCache(opts && opts.regexCacheSize)
        this._delimiter = this._opts.delimiter || '/'
    }

    compact() {
        this._regexCache.clear()
    }

    add(path: string, data: DATA, opts?: EntryOptions): void {
        const prefix = opts && opts.prefix
        if (!prefix && !(_RE_HasDynamic.test(path))) {
            if (this._statics[path] !== undefined)
                throw new Error(`path ${path} is already added`)
            this._statics[path] = data
            return
        }

        let curEntry = this._root
        let context: AddContext = {
            unnamedGroups: 0,
            regexCache: this._regexCache
        }

        const segments = new Lexer(path, this._delimiter).parse()
        for (const seg of segments) {
            if (seg.pattern) {
                curEntry = curEntry.addPattern(seg, context)
            } else {
                curEntry = curEntry.addStatic(seg.joinedStatic())
            }
        }

        if (curEntry.touched)
            throw new PathError(`path ${path} is already added`)

        curEntry.touched = true
        curEntry.path = path
        curEntry.data = data
        if (prefix)
            curEntry.prefix = true
        if (opts && opts.strict === false)
            curEntry.strict = false
    }

    find(path: string): FindResult<DATA> | undefined {
        const params: PathParams = {}

        const found = this._statics[path]
        if (found) {
            return {
                params,
                data: found
            }
        }

        const layers = (path[0] === this._delimiter ? path.substring(1) : path).split(this._delimiter)
        const route = this._root.find(0, { layers, params })
        if (!route)
            return undefined

        return {
            params,
            data: route.data!
        }
    }
}
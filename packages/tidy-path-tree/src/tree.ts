import { Cache, PathParams } from './types'
import { SimpleCache } from './cache'
import { PathNode } from './node'
import { createParser } from './grammar'
import { PathError } from './error'

const _RE_HasDynamic = /[:(*]/

export interface FindResult<DATA> {
    params: PathParams
    data: DATA
}

export interface PathTreeOptions {
    delimiter?: string
    regexCacheSize?: number
    regexCache?: Cache<string, RegExp>
}

export class PathTree<DATA> {
    private _statics: {
        [path: string]: DATA
    } = {}

    private _root = new PathNode('')
    private readonly _regexCache: Cache<string, RegExp>
    private readonly _delimiter: string

    constructor(opts?: PathTreeOptions) {
        this._regexCache = opts && opts.regexCache || new SimpleCache(opts && opts.regexCacheSize)
        this._delimiter = opts && opts.delimiter || '/'
    }

    compact() {
        this._regexCache.clear()
    }

    add(path: string, data: DATA): void {
        if (path[0] === this._delimiter)
            path = path.substring(1)

        if (!_RE_HasDynamic.test(path)) {
            if (this._statics) {
                if (this._statics[path] !== undefined)
                    throw new Error(`path ${path} is already added`)
                this._statics[path] = data
            } else {
                this._statics = { [path]: data }
            }
            return
        }

        const ast = createParser(this._delimiter)(path)
        if (!ast || ast.end === 0 || !ast.children || ast.children.length === 0)
            throw new PathError(`path ${path} is invalid format`)

        this._root.add({
            layers: ast.children,
            path,
            data,
            regexCache: this._regexCache,
            groupIndex: -1000
        }, 0)
    }

    find(path: string): FindResult<DATA> | undefined {
        if (path[0] === this._delimiter)
            path = path.substring(1)

        const params: PathParams = {}

        const found = this._statics[path]
        if (found !== undefined) {
            return {
                params,
                data: found
            }
        }

        const node = this._root.find(0, {
            layers: path.split(this._delimiter),
            params
        })
        if (!node)
            return undefined

        return {
            params,
            data: node._data
        }
    }
}

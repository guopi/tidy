import { Cache, PathParams } from './types'
import { SimpleCache } from './cache'
import { PathNode } from './node'
import { createParser, PathAstNode } from './grammar'
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
    parseCache?: Cache<string, PathAstNode | null>
}

export class PathTree<DATA> {
    private _statics: {
        [path: string]: DATA
    } = {}

    private _root = new PathNode('')
    private readonly _delimiter: string
    private readonly _regexCache: Cache<string, RegExp>
    private readonly _parseCache?: Cache<string, PathAstNode | null>

    constructor(opts?: PathTreeOptions) {
        this._regexCache = opts && opts.regexCache || new SimpleCache(opts && opts.regexCacheSize)
        this._delimiter = opts && opts.delimiter || '/'
        this._parseCache = opts && opts.parseCache
    }

    compact() {
        this._regexCache.clear()
        const cache = this._parseCache
        if (cache) cache.clear()
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

        const ast = this._parse(path)

        this._root.add({
            layers: ast.children,
            path,
            data,
            regexCache: this._regexCache,
            groupIndex: -1000
        }, 0)
    }

    private _parse(path: string): PathAstNode {
        const cache = this._parseCache
        let ast: PathAstNode | null | undefined = undefined
        if (cache)
            ast = cache.get(path)

        if (ast === undefined) {
            ast = createParser(this._delimiter)(path)
            if (cache)
                cache.set(path, ast)
        }

        if (!ast || ast.end === 0 || !ast.children || ast.children.length === 0)
            throw new PathError(`path ${path} is invalid format`)
        return ast
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

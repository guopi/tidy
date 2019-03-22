import { TidyBaseRequestType, TidyProcessor, TidyProcessorLike } from 'tidyjs'
import { PathTree, PathTreeOptions, SimpleCache } from 'tidy-path-tree'
import { parse } from 'url'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS'
const _allHttpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']

export class TidyRouter<REQ extends TidyBaseRequestType = TidyBaseRequestType> implements TidyProcessorLike<REQ> {
    private readonly _treeOpts: PathTreeOptions

    private _trees: {
        [method: string]: PathTree<TidyProcessor<REQ>>
    } = {}

    constructor(opts?: PathTreeOptions) {
        if (!opts) opts = {}
        if (!opts.regexCache) opts.regexCache = new SimpleCache()
        if (!opts.parseCache) opts.parseCache = new SimpleCache(128)
        this._treeOpts = opts
    }

    compact() {
        this._treeOpts.regexCache!.clear()
        this._treeOpts.parseCache!.clear()
    }

    asTidyProcessor(): TidyProcessor<REQ, REQ> {
        this.compact()
        return (ctx, next) => {
            const method = ctx.method.toUpperCase()

            const tree = this._trees[method]
            if (tree) {
                const path = parse(ctx.url).pathname || ''
                const found = tree.find(path)
                if (found) {
                    ctx.req.params = found.params
                    return found.data(ctx, next)
                }
            }
            return next(ctx)
        }
    }

    private _tree(method: HttpMethod): PathTree<TidyProcessor<REQ>> {
        let tree = this._trees[method]
        if (!tree) {
            tree = new PathTree(this._treeOpts)
            this._trees[method] = tree
        }
        return tree
    }

    on(method: HttpMethod | 'ALL' | HttpMethod[], path: string, handler: TidyProcessor<REQ>): this {
        if (Array.isArray(method)) {
            for (const m of method)
                this.on(m, path, handler)
        } else if (method === 'ALL') {
            this.on(_allHttpMethods, path, handler)
        } else {
            this._tree(method).add(path, handler)
            if (method === 'GET')
                this._tree('HEAD').add(path, handler)
        }
        return this
    }
}
import { ErrorResult, TidyBaseRequestType, TidyBaseResponseType, TidyPlugin, TidyPluginLike, TidyReturn } from 'tidyjs'
import { PathTree, PathTreeOptions, SimpleCache } from 'tidy-path-tree'
import { parse } from 'url'
import { isErrors, TidySchema, TypeOf, ValidateError } from 'tidy-json-schema'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS'
export type HttpMethods = HttpMethod | HttpMethod[] | 'ALL'
const _allHttpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']

type ValidateErrorResultCreator = (errors: ValidateError[]) => TidyReturn<any>

export interface TidyRouterOptions extends PathTreeOptions {
    onValidateError?: ValidateErrorResultCreator
}

export interface ApiInterface<REQ extends TidyBaseRequestType = TidyBaseRequestType,
    RESP extends TidyBaseResponseType | undefined = TidyBaseResponseType> {
    req: REQ
    resp?: RESP
}

export interface ApiSchema {
    req: TidySchema<any>
    resp?: TidySchema<any>
}

export class TidyRouter<REQ extends TidyBaseRequestType = TidyBaseRequestType> implements TidyPluginLike<REQ> {
    private readonly _treeOpts: PathTreeOptions
    private _onValidateError: ValidateErrorResultCreator

    private _trees: {
        [method: string]: PathTree<TidyPlugin<any>>
    } = {}

    constructor(opts?: TidyRouterOptions) {
        if (!opts) opts = {}
        if (!opts.regexCache) opts.regexCache = new SimpleCache()
        if (!opts.parseCache) opts.parseCache = new SimpleCache(128)
        this._treeOpts = opts
        this._onValidateError = opts.onValidateError || _defaultOnValidateError
    }

    compact() {
        this._treeOpts.regexCache!.clear()
        this._treeOpts.parseCache!.clear()
    }

    asTidyPlugin(): TidyPlugin<REQ, REQ> {
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

    private _tree(method: HttpMethod): PathTree<TidyPlugin<any>> {
        let tree = this._trees[method]
        if (!tree) {
            tree = new PathTree(this._treeOpts)
            this._trees[method] = tree
        }
        return tree
    }

    on<S extends TidySchema<any>>(
        method: HttpMethods,
        path: string | string[],
        schema: S,
        handler: TidyPlugin<TypeOf<S>>
    ): this

    on<R extends TidyBaseRequestType = REQ>(
        method: HttpMethods,
        path: string | string[],
        handler: TidyPlugin<R>
    ): this

    on(
        method: HttpMethods,
        path: string | string[],
        schemaOrHandler: TidySchema<any> | TidyPlugin<any>,
        _handler?: TidyPlugin<any>
    ): this {
        let handler: TidyPlugin<any>
        if (_handler) {
            const schema: TidySchema<any> = schemaOrHandler as TidySchema<any>
            handler = (ctx, next) => {
                const r = schema.validate(ctx.req, undefined)
                if (isErrors(r)) {
                    return this._onValidateError(r)
                }

                if (r !== undefined)
                    ctx.req = r.newValue

                return _handler(ctx, next)
            }
        } else {
            handler = schemaOrHandler as TidyPlugin<any>
        }

        if (method === 'ALL') method = _allHttpMethods
        if (Array.isArray(method)) {
            for (const m of method)
                this._add(m, path, handler)
        } else {
            this._add(method, path, handler)
        }

        return this
    }

    private _add(method: HttpMethod, path: string | string[], handler: TidyPlugin<any>) {
        if (Array.isArray(path)) {
            for (const p of path) {
                this._add(method, p, handler)
            }
        } else {
            this._tree(method).add(path, handler)
            if (method === 'GET')
                this._tree('HEAD').add(path, handler)
        }
    }
}

function _defaultOnValidateError(errors: ValidateError[]): TidyReturn<any> {
    return new ErrorResult({
        validate: errors
    })
}
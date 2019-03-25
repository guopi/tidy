import { ErrorResult, TidyBaseRequestType, TidyProcessor, TidyProcessorLike, TidyProcessReturn } from 'tidyjs'
import { PathTree, PathTreeOptions, SimpleCache } from 'tidy-path-tree'
import { parse } from 'url'
import { isErrors, TidySchema, TypeOf, ValidateError } from 'tidy-json-schema'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS'
export type HttpMethods = HttpMethod | HttpMethod[] | 'ALL'
const _allHttpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']

type ValidateErrorResultCreator = (errors: ValidateError[]) => TidyProcessReturn<any>

export interface TidyRouterOptions extends PathTreeOptions {
    onValidateError?: ValidateErrorResultCreator
}

export class TidyRouter<REQ extends TidyBaseRequestType = TidyBaseRequestType> implements TidyProcessorLike<REQ> {
    private readonly _treeOpts: PathTreeOptions
    private _onValidateError: ValidateErrorResultCreator

    private _trees: {
        [method: string]: PathTree<TidyProcessor<any>>
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

    private _tree(method: HttpMethod): PathTree<TidyProcessor<any>> {
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
        handler: TidyProcessor<TypeOf<S>>
    ): this

    on<R extends TidyBaseRequestType = REQ>(
        method: HttpMethods,
        path: string | string[],
        handler: TidyProcessor<R>
    ): this

    on(
        method: HttpMethods,
        path: string | string[],
        schemaOrHandler: TidySchema<any> | TidyProcessor<any>,
        handler?: TidyProcessor<any>
    ): this {
        let processor: TidyProcessor<any>
        if (handler) {
            const schema: TidySchema<any> = schemaOrHandler as TidySchema<any>
            processor = (ctx, next) => {
                const r = schema.validate(ctx.req, undefined)
                if (isErrors(r)) {
                    return this._onValidateError(r)
                }

                if (r !== undefined)
                    ctx.req = r.newValue

                return handler(ctx, next)
            }
        } else {
            processor = schemaOrHandler as TidyProcessor<any>
        }

        if (method === 'ALL') method = _allHttpMethods
        if (Array.isArray(method)) {
            for (const m of method)
                this._add(m, path, processor)
        } else {
            this._add(method, path, processor)
        }

        return this
    }

    private _add(method: HttpMethod, path: string | string[], handler: TidyProcessor<any>) {
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

function _defaultOnValidateError(errors: ValidateError[]): TidyProcessReturn<any> {
    return new ErrorResult({
        validate: errors
    })
}
import {
    ErrorResult,
    HttpReturn,
    OrPromise,
    TidyContext,
    TidyNext,
    TidyPlugin,
    TidyPluginLike,
    TidyResponse,
    WithProperty,
} from 'tidyjs'
import { PathParams, PathTree, PathTreeOptions, SimpleCache } from 'tidy-path-tree'
import { parse } from 'url'
import { isErrors, TidySchema, TypeOf, ValidateError } from 'tidy-json-schema'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS'
export type HttpMethods = HttpMethod | HttpMethod[] | 'ALL'
const _allHttpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']

type ValidateErrorResultCreator = (errors: ValidateError[]) => HttpReturn<any>

export interface TidyRouterOptions extends PathTreeOptions {
    onValidateError?: ValidateErrorResultCreator
}

export interface ApiInterface<REQ, RESP = HttpReturn<TidyResponse>> {
    req: REQ
    resp?: RESP
}

type ApiRespTypeOf<T> = T extends { resp?: any } ? T['resp'] : any
type ApiHandler<API extends ApiInterface<any, any>> = (
    ctx: TidyContext<API['req']>,
    next: TidyNext<API['req'], ApiRespTypeOf<API> | API['req']>
) => OrPromise<HttpReturn<ApiRespTypeOf<API>>>

export interface ApiSchema {
    req: TidySchema<any>
    resp?: TidySchema<any>
}

type SchemaRespTypeOf<T> = T extends { resp: TidySchema<any> } ? TypeOf<T['resp']> : any
type SchemaHandler<S extends ApiSchema> = (
    ctx: TidyContext<TypeOf<S['req']>>,
    next: TidyNext<TypeOf<S['req']>, SchemaRespTypeOf<S> | TypeOf<S['req']>>
) => OrPromise<HttpReturn<SchemaRespTypeOf<S>>>

export type WithPathParams<T> = WithProperty<T, { params?: PathParams }>

export class TidyRouter<REQ, RESP = HttpReturn<TidyResponse>> implements TidyPluginLike<REQ, RESP, WithPathParams<REQ>, RESP> {
    private readonly _treeOpts: PathTreeOptions
    private _onValidateError: ValidateErrorResultCreator

    private _trees: {
        [method: string]: PathTree<TidyPlugin<any, any>>
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

    asTidyPlugin(): TidyPlugin<REQ, RESP, WithPathParams<REQ>> {
        type NextReq = WithPathParams<REQ>
        this.compact()
        return (ctx, next) => {
            const method = ctx.method.toUpperCase()

            const tree = this._trees[method]
            if (tree) {
                const path = parse(ctx.url).pathname || ''
                const found = tree.find(path)
                if (found) {
                    (ctx.req as any as NextReq).params = found.params as NextReq['params']
                    return found.data(ctx, next)
                }
            }
            return next(ctx as any as TidyContext<NextReq>)
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

    on<API extends ApiInterface<any, any> = { req: REQ }>(
        method: HttpMethods,
        path: string | string[],
        handler: ApiHandler<API>
    ): this

    on<S extends ApiSchema>(
        schema: S,
        method: HttpMethods,
        path: string | string[],
        handler: SchemaHandler<S>
    ): this

    on(..._args: [ApiSchema, HttpMethods, string | string[], SchemaHandler<any>] | [HttpMethods, string | string[], ApiHandler<any>]): this {
        let method: HttpMethods
        let path: string | string[]
        let handler: TidyPlugin<any>

        if (_args[3] !== undefined) {
            const args = _args as [ApiSchema, HttpMethods, string | string[], SchemaHandler<any>]

            method = args[1]
            path = args[2]
            const schema = args[0]
            const orgHandler = args[3]

            handler = (ctx, next) => {
                const r = schema.req.validate(ctx.req, undefined)
                if (isErrors(r)) {
                    return this._onValidateError(r)
                }

                if (r !== undefined)
                    ctx.req = r.newValue

                return orgHandler(ctx, next)
            }
        } else {
            const args = _args as [HttpMethods, string | string[], ApiHandler<any>]
            method = args[0]
            path = args[1]
            handler = args[2]
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

function _defaultOnValidateError(errors: ValidateError[]) {
    return new ErrorResult({
        validate: errors
    })
}
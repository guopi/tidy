import {
    composePlugins,
    ErrorResult,
    justCallNext,
    NextPlugin,
    OrArray,
    OrPromise,
    TidyLogger,
    TidyPlugin,
    TidyPluginLike,
    WebContext,
    WebRequest,
    WebReturn
} from 'tidyjs'
import { PathParams, PathTree, PathTreeOptions, SimpleCache } from 'tidy-path-tree'
import { parse } from 'url'
import { isErrors, TidySchema, TypeOf, ValidateError } from 'tidy-json-schema'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS'
export type HttpMethods = HttpMethod | HttpMethod[] | 'ALL'
const _allHttpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']

type ValidateErrorBuilder = (errors: ValidateError[]) => WebReturn<any>

export interface TidyRouterOptions extends PathTreeOptions {
    logger?: TidyLogger
    validateErrorBuilder?: ValidateErrorBuilder
}

export interface ApiInterface<Req, Resp = WebReturn> {
    req: Req
    resp?: Resp
}

type ApiRespTypeOf<T> = T extends { resp?: any } ? T['resp'] : any
type ApiHandler<API extends ApiInterface<any, any>> = (
    ctx: WebContext<API['req']>,
    next: NextPlugin<API['req'], ApiRespTypeOf<API> | API['req']>
) => OrPromise<WebReturn<ApiRespTypeOf<API>>>

export interface ApiSchema {
    req: TidySchema<any>
    resp?: TidySchema<any>
}

type SchemaRespTypeOf<T> = T extends { resp: TidySchema<any> } ? TypeOf<T['resp']> : any
type SchemaHandler<S extends ApiSchema> = (
    ctx: WebContext<TypeOf<S['req']>>,
    next: NextPlugin<TypeOf<S['req']>, SchemaRespTypeOf<S> | TypeOf<S['req']>>
) => OrPromise<WebReturn<SchemaRespTypeOf<S>>>

export type WithPathParams<T> = T & { params?: PathParams }

export function tidyRouter<Req = WebRequest, Resp = WebReturn>(opts?: TidyRouterOptions) {
    return new TidyRouter<Req, Resp>(opts)
}

interface ApiRule<API extends ApiInterface<any, any>> {
    method: HttpMethods,
    path: string | string[],
    handler: ApiHandler<API>
}

interface SchemaRule<S extends ApiSchema> {
    schema: S,
    method: HttpMethods,
    path: string | string[],
    handler: SchemaHandler<S>
}

type TreeMap = {
    [method in HttpMethod]?: PathTree<TidyPlugin<any, any>>
}

class DispatchEnv {
    readonly trees: TreeMap = {}
    readonly validateErrorBuilder: ValidateErrorBuilder

    constructor(private opts: TidyRouterOptions) {
        this.validateErrorBuilder = opts.validateErrorBuilder || defaultValidateErrorBuilder
    }

    _add(method: HttpMethod, path: string | string[], handler: TidyPlugin<any>, addHeadWhenGet: boolean) {
        if (Array.isArray(path)) {
            for (const p of path) {
                this._add(method, p, handler, addHeadWhenGet)
            }
        } else {
            if (this.opts.logger)
                this.opts.logger.debug({ method, path }, 'add route path')
            this._tree(method).add(path, handler)
            if (addHeadWhenGet && method === 'GET')
                this._tree('HEAD').add(path, handler)
        }
    }

    _tree(method: HttpMethod): PathTree<TidyPlugin<any>> {
        let tree = this.trees[method]
        if (!tree) {
            tree = new PathTree(this.opts)
            this.trees[method] = tree
        }
        return tree
    }
}

function addPathPrefix(path: string | string[], prefix: string): string | string[] {
    return Array.isArray(path)
        ? path.map(it => prefix + it)
        : prefix + path
}

class Router<Req, Resp> {
    protected _rules?: (ApiRule<any> | SchemaRule<any> | Router<any, any>)[]

    constructor(protected readonly prefix: string) {
    }

    protected buildDispatchEnv(env: DispatchEnv, prefix: string) {
        if (this._rules) {
            const newPrefix = prefix + this.prefix
            for (const rule of this._rules) {
                if (rule instanceof Router) {
                    rule.buildDispatchEnv(env, newPrefix)
                } else {
                    let handler: TidyPlugin<any>

                    if ((rule as SchemaRule<any>).schema) {
                        const schemaRule = rule as SchemaRule<ApiSchema>
                        handler = (ctx, next) => {
                            const r = schemaRule.schema.req.validate(ctx.req, undefined)
                            if (isErrors(r)) {
                                return env.validateErrorBuilder(r)
                            }

                            if (r !== undefined)
                                ctx.req = r.newValue

                            return schemaRule.handler(ctx, next)
                        }
                    } else {
                        handler = rule.handler
                    }

                    const method: HttpMethods = rule.method === 'ALL' ? _allHttpMethods : rule.method
                    const path = newPrefix ? addPathPrefix(rule.path, newPrefix) : rule.path

                    if (Array.isArray(method)) {
                        for (const m of method)
                            env._add(m, path, handler, false)
                    } else {
                        env._add(method, path, handler, true)
                    }
                }
            }
        }
    }

    on(rule: OrArray<ApiRule<any> | SchemaRule<any>>): Router<Req, Resp>

    on<API extends ApiInterface<any, any> = { req: Req }>(
        method: HttpMethods,
        path: string | string[],
        handler: ApiHandler<API>
    ): Router<Req, Resp>

    on<S extends ApiSchema>(
        schema: S,
        method: HttpMethods,
        path: string | string[],
        handler: SchemaHandler<S>
    ): Router<Req, Resp>

    on(
        arg0: OrArray<ApiRule<any> | SchemaRule<any>> | HttpMethods | ApiSchema,
        arg1?: string | string[] | HttpMethods,
        arg2?: ApiHandler<any> | string | string[],
        arg3?: SchemaHandler<any>
    ): Router<Req, Resp> {
        if (!this._rules) this._rules = []
        if (arg1 === undefined) {
            const rules = arg0 as OrArray<ApiRule<any> | SchemaRule<any>>
            if (Array.isArray(rules)) {
                this._rules.push(...rules)
            } else {
                this._rules.push(rules)
            }
        } else if (arg3 === undefined) {
            this._rules.push({
                method: arg0 as HttpMethods,
                path: arg1 as string | string[],
                handler: arg2 as ApiHandler<any>
            })
        } else {
            this._rules.push({
                schema: arg0 as ApiSchema,
                method: arg1 as HttpMethods,
                path: arg2 as string | string[],
                handler: arg3 as SchemaHandler<any>
            })
        }
        return this
    }

    subRouter(prefix: string, builder: (sub: Router<Req, Resp>) => void): Router<Req, Resp> {
        const sub = new Router<Req, Resp>(prefix)
        builder(sub)
        if (!this._rules) this._rules = []
        this._rules.push(sub)
        return this
    }

    asTidyPlugin(): TidyPlugin<Req, Resp, WithPathParams<Req>> {
        throw new Error('asTidyPlugin in subRouter not implemented')
    }
}

class TidyRouter<Req, Resp> extends Router<Req, Resp> implements TidyPluginLike<Req, Resp, WithPathParams<Req>> {
    private readonly opts: TidyRouterOptions

    private _plugins?: TidyPlugin<any, any>[]

    constructor(opts?: TidyRouterOptions) {
        super('')
        if (!opts) opts = {}
        if (!opts.regexCache) opts.regexCache = new SimpleCache()
        if (!opts.parseCache) opts.parseCache = new SimpleCache(128)
        this.opts = opts
    }

    compact() {
        this.opts.regexCache!.clear()
        this.opts.parseCache!.clear()
    }

    asTidyPlugin(): TidyPlugin<Req, Resp, WithPathParams<Req>> {
        type NextReq = WithPathParams<Req>

        if (!this._rules) {
            return this._plugins ? composePlugins([...this._plugins]) : justCallNext
        }

        const env = new DispatchEnv(this.opts)
        this.buildDispatchEnv(env, this.prefix)

        this.compact()

        const dispatch = (ctx: WebContext<Req>, next: NextPlugin<WithPathParams<Req>, Resp>) => {
            const method = ctx.method.toUpperCase() as HttpMethod

            const tree = env.trees[method]
            if (tree) {
                const path = parse(ctx.url).pathname || ''
                const found = tree.find(path)
                if (found) {
                    (ctx.req as any as NextReq).params = found.params as NextReq['params']
                    return found.data(ctx, next)
                }
            }
            return next(ctx as any as WebContext<NextReq>)
        }
        return this._plugins
            ? composePlugins([...this._plugins, dispatch])
            : dispatch
    }

    public use<NextReq, NextResp>(
        plugin:
            TidyPlugin<Req, Resp, NextReq, NextResp>
            | TidyPluginLike<Req, Resp, NextReq, NextResp>
    ): Router<NextReq, NextResp> {
        if (!this._plugins)
            this._plugins = []

        if ((plugin as TidyPluginLike<any, any>).asTidyPlugin)
            this._plugins.push((plugin as TidyPluginLike<any, any>).asTidyPlugin())
        else
            this._plugins.push(plugin as TidyPlugin<any, any>)

        return this as any as Router<NextReq, NextResp>
    }
}

function defaultValidateErrorBuilder(errors: ValidateError[]) {
    return new ErrorResult({
        validate: errors
    })
}
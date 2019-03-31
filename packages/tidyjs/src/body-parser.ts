import { TidyNext, TidyPlugin } from './app'
import { TidyContext } from './context'
import CoBody from 'co-body'
import { TidySimpleData, WithProperty } from './types'

interface CatOpts {
    extendTypes?: string[]
    opts?: CoBody.Options
}

export interface BodyParserOptions {
    json?: CatOpts | false
    form?: CatOpts | false
    text?: CatOpts | false
}

const _defaultEnv = {
    json: {
        types: [
            'application/json',
            'application/json-patch+json',
            'application/vnd.api+json',
            'application/csp-report',
        ]
    },
    form: {
        types: [
            'application/x-www-form-urlencoded'
        ]
    },
    text: {
        types: [
            'text/plain'
        ]
    },
}

type BodyCat = 'json' | 'form' | 'text'

interface CatEnv {
    types: string[]
    opts?: CoBody.Options
}

function _createEnv(cat: BodyCat, options?: BodyParserOptions): CatEnv | undefined {
    if (!options)
        return _defaultEnv[cat]

    const catOpt = options[cat]
    if (catOpt === undefined)
        return _defaultEnv[cat]

    if (catOpt === false)
        return undefined

    const extendTypes = catOpt.extendTypes
    const defaultTypes = _defaultEnv[cat].types
    return {
        types: extendTypes && extendTypes.length > 0
            ? [...defaultTypes, ...extendTypes]
            : defaultTypes,
        opts: catOpt.opts
    }
}

const _allCats: BodyCat[] = ['json', 'form', 'text']

class CatEnvs {
    json?: CatEnv
    form?: CatEnv
    text?: CatEnv

    constructor(options?: BodyParserOptions) {
        for (const cat of _allCats) {
            this[cat] = _createEnv(cat, options)
        }
    }

    async parse(ctx: TidyContext<any>): Promise<any> {
        const req = ctx._originReq

        for (const cat of _allCats) {
            const catOpts = this[cat]
            if (catOpts && ctx.is(...catOpts.types))
                return CoBody[cat](req, catOpts.opts)
        }
        return {}
    }
}

export type WithBody<T> = WithProperty<T, { body?: TidySimpleData }>

export function tidyBodyParser<REQ, RESP>(options?: BodyParserOptions): TidyPlugin<REQ, RESP, WithBody<REQ>> {
    const env = new CatEnvs(options)
    type NextReq = WithBody<REQ>

    return async function bodyParser(ctx: TidyContext<REQ>, next: TidyNext<NextReq, RESP>): Promise<RESP> {
        const req = ctx.req as WithBody<REQ>
        if (req.body === undefined && !ctx.disabled(tidyBodyParser.DISABLE_KEY)) {
            req.body = await env.parse(ctx)
        }

        return Promise.resolve(next(ctx as any as TidyContext<NextReq>))
    }
}

tidyBodyParser.DISABLE_KEY = 'parseBody'

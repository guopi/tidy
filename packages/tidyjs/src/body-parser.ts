import { TidyBaseRequestType } from './types'
import { TidyNextProcessor } from './app'
import { TidyProcessReturnPromise } from './result'
import { TidyProcessContext } from './context'
import CoBody from 'co-body'

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

    async parse<REQ extends TidyBaseRequestType>(ctx: TidyProcessContext<REQ>): Promise<any> {
        const req = ctx._originReq

        for (const cat of _allCats) {
            const catOpts = this[cat]
            if (catOpts && ctx.is(...catOpts.types))
                return CoBody[cat](req, catOpts.opts)
        }
        return {}
    }
}

export function tidyBodyParser<REQ extends TidyBaseRequestType = TidyBaseRequestType>(options?: BodyParserOptions) {
    const env = new CatEnvs(options)

    return async function bodyParser(ctx: TidyProcessContext<REQ>, next: TidyNextProcessor<REQ>): TidyProcessReturnPromise<any> {
        if (ctx.req.body === undefined && !ctx.disabled(tidyBodyParser.DISABLE_KEY)) {
            ctx.req.body = await env.parse(ctx)
        }

        return next(ctx)
    }
}

tidyBodyParser.DISABLE_KEY = 'parseBody'

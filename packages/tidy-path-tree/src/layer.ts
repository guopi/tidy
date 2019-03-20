import { PathParams } from './types'
import { Segment, Token } from './lexer'
import { SimpleCache } from './cache'
import { sameArray } from './util'

export interface AddContext {
    unnamedGroups: number
    readonly regexCache: SimpleCache<string, RegExp>
}

export interface FindContext {
    readonly layers: ReadonlyArray<string>
    readonly params: PathParams
}

export interface LayerPattern<DATA> {
    reStr: string
    reObj: RegExp
    keys: (string | number)[]   // key of the Nth item, string: name, number: unnamed index
    groups: number[]            // group index of the Nth item
    raw?: string                // raw path layer of whole LayerPattern
    layer: Layer<DATA>
}

export class Layer<DATA> {
    touched?: boolean
    path?: string
    data?: DATA
    prefix?: boolean
    strict?: boolean

    private _statics?: { [text: string]: Layer<DATA> }
    private _patterns?: LayerPattern<DATA>[]
    private _leadOptLayer?: Layer<DATA>

    addStatic(text: string): Layer<DATA> {
        if (!this._statics)
            this._statics = {}

        const cur = this._statics[text]
        if (cur)
            return cur
        const layer = new Layer<DATA>()
        this._statics[text] = layer
        return layer
    }

    addPattern(seg: Segment, ctx: AddContext): Layer<DATA> {
        let reStr = '^'

        let groupIndex = 1
        let keys: (string | number)[] = []
        let groups: number[] = []
        let unnamed = 0
        for (const token of seg.tokens) {
            if (typeof token === 'string') {
                reStr += _escapeRegexp(token)
            } else {
                groups.push(groupIndex)
                if (token.name) {
                    keys.push(token.name)
                } else {
                    keys.push(ctx.unnamedGroups + unnamed)
                    unnamed++
                }

                groupIndex += token.groups
                reStr += '(' + token.reg + ')' + (token.opt ? '?' : '')
            }
        }
        reStr += '$'
        ctx.unnamedGroups += unnamed

        const found = this._findPattern(reStr)
        if (found) {
            if (!sameArray(found.keys, keys)) {
                throw Error('named Capture conflict ' + seg.raw + ' -> ' + found.raw)
            }
            return found.layer
        }

        const pattern: LayerPattern<DATA> = {
            reStr,
            reObj: ctx.regexCache.get(reStr) || ctx.regexCache.set(reStr, new RegExp(reStr)),
            keys: keys,
            groups,
            raw: seg.raw,
            layer: new Layer<DATA>()
        }

        if (seg.tokens.length === 1 && (seg.tokens[0] as Token).opt) {
            this._leadOptLayer = pattern.layer
        }

        if (!this._patterns)
            this._patterns = []
        this._patterns.push(pattern)

        return pattern.layer
    }

    find(index: number, ctx: FindContext): Layer<DATA> | undefined {
        const staticFound = this._findStatic(index, ctx)
        if (staticFound !== undefined)
            return staticFound

        if (!this._patterns || !this._patterns.length)
            return undefined

        const layer = ctx.layers[index]
        const isLast = ctx.layers.length - 1 === index

        for (const pattern of this._patterns) {
            if (!pattern)
                continue

            // use test for better performance
            const matched = pattern.reObj.exec(layer)
            if (matched) {
                let nextRoute = pattern.layer

                if (isLast) {
                    if (!nextRoute.touched) {
                        if (nextRoute._leadOptLayer && nextRoute._leadOptLayer.strict === false) {
                            return nextRoute._leadOptLayer
                        }
                        return undefined
                    }
                    _buildParam(matched, pattern.groups, pattern.keys, ctx.params)

                    return nextRoute
                }

                let nextFound = nextRoute.find(index + 1, ctx)

                if (nextFound || nextRoute.prefix) {
                    _buildParam(matched, pattern.groups, pattern.keys, ctx.params)
                    return nextFound ? nextFound : nextRoute
                }
            }
        }
    }

    private _findStatic(index: number, ctx: FindContext): Layer<DATA> | undefined {
        const layer = ctx.layers[index]

        const statics = this._statics
        const found = statics && statics[layer]
        if (found) {
            const isLast = index === ctx.layers.length - 1

            // if absolute match or  the route has end === false option
            if (isLast) {
                if (found.touched) {
                    return found
                }

                // /blog/:id?  + strict  vs  /blog
                if (found._leadOptLayer && found._leadOptLayer.strict === false) {
                    return found._leadOptLayer
                }

                return undefined
            }

            let nextFound = found.find(index + 1, ctx)
            if (nextFound)
                return nextFound

            // prefix===true means touched
            if (found.prefix)
                return found
        }
    }

    private _findPattern(reStr: string): LayerPattern<DATA> | undefined {
        if (this._patterns) {
            for (const p of this._patterns) {
                if (p.reStr === reStr)
                    return p
            }
        }
    }
}

function _buildParam(execRet: RegExpExecArray, groups: number[], names: (string | number)[], params: PathParams) {
    for (let i = 0, len = names.length; i < len; i++) {
        const name = names[i]
        if (typeof name === 'string')
            params[name] = execRet[groups[i]]
    }
}

const _RE_ESCAPE = /([.+*?=^!:${}()[\]|/\\])/g
function _escapeRegexp(str: string) {
    return str.replace(_RE_ESCAPE, '\\$1')
}


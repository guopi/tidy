import { Cache } from './types'
import { DEFAULT_PARAM_PATTERN, PathAstNode, PathGrammarType } from './grammar'
import { PathError } from './error'

type Char = string

export interface AddContext {
    readonly path: string
    readonly data: any
    readonly regexCache: Cache<string, RegExp>
    groupIndex: number
    layers: PathAstNode[]
}

type ParamNameAndIndex = [string, number]
type ParamNameAndIndexes = ParamNameAndIndex[]

export class PathNode {
    /**
     * @param raw raw text of path
     */
    constructor(public raw: string) {
    }

    reObj?: RegExp              // not nil means dyna
    reStr?: string
    params?: ParamNameAndIndexes
    canEmpty?: boolean
    globstar?: boolean

    subs?: PathNode[]
    _statics?: { [text: string]: PathNode }
    _path?: string      // mounted path
    _data?: any         // mounted _data

    mounted(): boolean {
        return !!this._path
    }

    add(ctx: AddContext, index: number): void {
        const layer = ctx.layers[index]
        if (!layer)
            throw new PathError(`path ${ctx.path} is invalid format: layer ${index} is not exists`)

        const newSub = new PathNode(nodeText(layer))
        const lastLayer = index >= ctx.layers.length - 1
        if (lastLayer) {
            // last layer
            newSub._data = ctx.data
            newSub._path = ctx.path
        }

        const segs = layer.children
        const subFoundOrCreate = (segs && hasDynaSeg(segs))
            ? this._addDynaSubNode(ctx, segs, lastLayer, newSub)
            : this._addStaticSubNode(ctx, lastLayer, newSub)

        if (!lastLayer)
            subFoundOrCreate.add(ctx, index + 1)
    }

    private _addDynaSubNode(ctx: AddContext, segs: PathAstNode[], lastLayer: boolean, newSub: PathNode): PathNode {
        ctx.groupIndex = 1
        let reStr = '^'
        let ret: PathNode = newSub
        for (const seg of segs) {
            switch (nodeType(seg)) {
                case 'Text':
                    reStr += escapeTextToRegexStr(nodeText(seg))
                    break
                case 'Param':
                    reStr += createRegexStrFromParam(ctx, seg, newSub)
                    break
                case 'ReGroup':
                    reStr += createRegexStrFromReGroup(ctx, seg, newSub)
                    break
                default:
                    reStr += nodeText(seg)
            }
        }
        reStr += '$'

        const found = this._findSubFromReStr(reStr)
        if (found) {
            ret = found
            if (!sameParams(found.params, found.params))
                throw Error(`named Capture conflict ${newSub.raw} -> ${found.raw}`)

            if (lastLayer && found.mounted()) {
                throw new PathError(`path ${ctx.path} is already added`)
            }
        } else {
            newSub.reStr = reStr
            newSub.reObj = ctx.regexCache.get(reStr) || ctx.regexCache.set(reStr, new RegExp(reStr))
            this._addSub(newSub)
        }

        return ret
    }

    private _addStaticSubNode(ctx: AddContext, lastLayer: boolean, newSub: PathNode) {
        const text = newSub.raw
        let ret = newSub
        if (text === '**') {
            if (!lastLayer)
                throw Error('globstar ** must at end of the path, path=' + ctx.path)

            newSub.globstar = true
        }

        if (!this._statics) {
            this._statics = { [text]: newSub }
        } else {
            const found = this._statics[text]
            if (found) {
                ret = found
                if (lastLayer && found.mounted()) {
                    throw new PathError(`path ${ctx.path} is already added`)
                }
            } else {
                this._statics[text] = newSub
            }
        }
        return ret
    }

    private _addSub(sub: PathNode): void {
        if (!this.subs)
            this.subs = []
        this.subs.push(sub)
    }

    private _findSubFromReStr(reStr: string): PathNode | undefined {
        if (this.subs) {
            for (const p of this.subs) {
                if (p.reStr === reStr)
                    return p
            }
        }
    }

    addParam(name: string, groupIndex: number) {
        const found = this.findParam(name)
        if (found !== undefined)
            return new PathError(`path param name duplicated: ${name} at #${found[1]}`)

        if (!this.params)
            this.params = []
        this.params.push([name, groupIndex])
    }

    findParam(name: string): ParamNameAndIndex | undefined {
        if (this.params) {
            for (const p of this.params) {
                if (p[0] === name)
                    return p
            }
        }
        return undefined
    }
}

function createRegexStrFromParam(ctx: AddContext, seg: PathAstNode, paramsTo: PathNode): string {
    let reStr: string
    const paramGroupIndex = ctx.groupIndex

    const childCount = nodeChildCount(seg)
    let paramNameEnd = seg.end
    if (childCount > 0) {
        if (childCount !== 1) {
            throw new PathError(`Param Seg ${nodeText(seg)} is invalid format, it has ${childCount} children node`)
        }
        const firstChild = seg.children[0]
        if (!firstChild || !isType(firstChild, 'ReGroup'))
            throw new PathError(`Param Seg ${nodeText(seg)} has invalid ${nodeType(firstChild)} children node`)

        paramNameEnd = firstChild.start
        reStr = createRegexStrFromReGroup(ctx, firstChild, paramsTo)
    } else {
        ctx.groupIndex++
        reStr = `(${DEFAULT_PARAM_PATTERN})`
    }
    const opt = seg.input.charAt(paramNameEnd - 1) === '?'
    if (opt) {
        paramNameEnd--
        reStr += '?'
    }

    const paramName = seg.input.substring(seg.start + 1, paramNameEnd)
    paramsTo.addParam(paramName, paramGroupIndex)

    return reStr
}

function createRegexStrFromReGroup(ctx: AddContext, seg: PathAstNode, paramsTo: PathNode): string {
    let reStr = '('
    ctx.groupIndex++

    if (seg.children) {
        for (const sub of seg.children) {
            switch (nodeType(sub)) {
                case 'ReGroup':
                    reStr += createRegexStrFromReGroup(ctx, sub, paramsTo)
                    break
                case 'Param':
                    reStr += createRegexStrFromParam(ctx, sub, paramsTo)
                    break
                default:
                    reStr += nodeText(sub)
            }
        }
    }

    reStr += ')'
    return reStr
}

function nodeChildCount(node: PathAstNode): number {
    return node.children ? node.children.length : 0
}

function nodeText(node: PathAstNode): string {
    if (node.end > node.start) {
        return node.input.substring(node.start, node.end)
    }
    return ''
}

function isType(node: PathAstNode, type: PathGrammarType): boolean {
    return node.rule ? node.rule.name === type : false
}

function nodeType(node: PathAstNode): PathGrammarType | undefined {
    return node.rule ? node.rule.name as PathGrammarType : undefined
}

function hasDynaSeg(segs: PathAstNode[]): boolean {
    for (const seg of segs) {
        if (!isType(seg, 'Text'))
            return true
    }
    return false
}

function escapeTextToRegexStr(text: string): string {
    //todo
    return text
}

function sameParams(params1: ParamNameAndIndexes | undefined, params2: ParamNameAndIndexes | undefined) {
    const n1 = params1 ? params1.length : 0
    const n2 = params2 ? params2.length : 0
    if (n1 !== n2)
        return false

    for (let i = 0; i < n1; i++) {
        if (params1![i][0] !== params2![i][0] || params1![i][1] !== params2![i][1])
            return false
    }
    return true
}


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

type ParamNameAndIndexes = [string, number][]

export class PathNode {
    reObj?: RegExp      // not nil means dyna
    reStr?: string
    raw?: string
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

    add(ctx: AddContext, index: number) {
        const layer = ctx.layers[index]
        if (!layer)
            throw new PathError(`path ${ctx.path} is invalid format: layer ${index} is not exists`)

        const node = new PathNode()
        const lastLayer = index >= ctx.layers.length - 1
        if (lastLayer) {
            // last layer
            node._data = ctx.data
            node._path = ctx.path
        }
        let nextNode = node

        if (layer.end > layer.start) {
            node.raw = nodeText(layer)
            const segs = layer.children
            if (segs) {
                if (hasDynaSeg(layer.children)) {
                    let reStr = '^'
                    for (const seg of segs) {
                        if (isType(seg, 'Text')) {
                            reStr += escapeTextToRegexStr(nodeText(seg))
                        } else if (isType(seg, 'Param')) {
                            const paramGroupIndex = ctx.groupIndex

                            const childCount = nodeChildCount(seg)
                            let paramNameEnd = seg.end
                            if (childCount > 0) {
                                if (childCount !== 1)
                                    throw new PathError(`Param Seg ${nodeText(seg)} is invalid format, it has ${childCount} children node`)
                                const firstSegChild = seg.children[0]
                                if (!isType(firstSegChild, 'ReGroup'))
                                    throw new PathError(`Param Seg ${nodeText(seg)} has invalid ${nodeType(firstSegChild)} children node`)

                                paramNameEnd = firstSegChild.start
                                reStr += nodeText(firstSegChild)
                                countReGroups(ctx, firstSegChild)
                            } else {
                                ctx.groupIndex++
                                reStr += `(${DEFAULT_PARAM_PATTERN})`
                            }
                            const opt = seg.input.charAt(paramNameEnd - 1) === '?'
                            if (opt) {
                                paramNameEnd--
                                reStr += '?'
                            }

                            const paramName = seg.input.substring(seg.start + 1, paramNameEnd)
                            if (!node.params)
                                node.params = []
                            node.params.push([paramName, paramGroupIndex])

                        } else if (isType(seg, 'ReGroup')) {
                            reStr += nodeText(seg)
                            countReGroups(ctx, seg)
                        }
                    }
                    reStr += '$'

                    const found = this._findSub(reStr)
                    if (found) {
                        nextNode = found
                        if (!sameParams(found.params, found.params))
                            throw Error('named Capture conflict ' + node.raw + ' -> ' + found.raw)

                        if (lastLayer && found.mounted()) {
                            throw new PathError(`path ${ctx.path} is already added`)
                        }
                    } else {
                        if (!this.subs) this.subs = []
                        node.reStr = reStr
                        node.reObj = ctx.regexCache.get(reStr) || ctx.regexCache.set(reStr, new RegExp(reStr))
                        this.subs.push(node)
                    }
                } else {
                    const text = node.raw
                    if (text === '**') {
                        if (!lastLayer)
                            throw Error('globstar ** must at end of the path, path=' + ctx.path)

                        node.globstar = true
                    }
                    if (!this._statics) {
                        this._statics = { [text]: node }
                    } else {
                        const found = this._statics[text]
                        if (found) {
                            nextNode = found
                            if (lastLayer && found.mounted()) {
                                throw new PathError(`path ${ctx.path} is already added`)
                            }
                        } else {
                            this._statics[text] = node
                        }
                    }
                }
            }
        }

        if (!lastLayer)
            nextNode.add(ctx, index + 1)
    }

    private _findSub(reStr: string): PathNode | undefined {
        if (this.subs) {
            for (const p of this.subs) {
                if (p.reStr === reStr)
                    return p
            }
        }
    }
}

function countReGroups(ctx: AddContext, node: PathAstNode): void {
    if (nodeType(node) === 'ReGroup') {
        ctx.groupIndex++
        if (node.children) {
            for (const sub of node.children)
                countReGroups(ctx, sub)
        }
    }
}

function nodeChildCount(node: PathAstNode): number {
    return node.children ? node.children.length : 0
}

function nodeLastChar(node: PathAstNode): Char | undefined {
    return node.input.charAt(node.end - 1)
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


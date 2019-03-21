import { createParser } from '../src/parser'
import { Myna as m } from 'myna-parser'

const parser = createParser('/')

let input: string
input = ':a([0-9]+)/:b-:c/(a-([0-9]+)?)/:d/end'

const r = parser(input)
console.log(`====== parse input start =====
${input}
====== input end =====
result =`)

showAst(r)

console.log('\n--end--\n')

function indent(level: number): string {
    let ret = ''
    for (let i = level; i > 0; --i)
        ret += '    '
    return ret
}

function showAst(node: m.AstNode, level: number = 0) {
    if (!node)
        return

    console.log(`${indent(level)}- ${node.rule && node.rule.name}: ${node.rule && node.rule.type} (${node.input.substring(node.start, node.end)}) rules=${node.rule && node.rule.rules} [${node.children && node.children.length}]`)
    if (node.children) {
        for (const c of node.children) {
            showAst(c, level + 1)
        }
    }
}
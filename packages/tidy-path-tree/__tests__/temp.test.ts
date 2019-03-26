import { createParser } from '../src/grammar'
import { PathTree } from '../src/tree'
import { PathAstNode } from '../src/myna'

function testParser() {
    let path: string
    path = ':p0?/:a?([0-9]+)/:b-:c/(a-([0-9]+)?)/:d'
    path = ':b(a-([0-9]+)-:x(a|b))'

    const parser = createParser('/')

    const r = parser(path)
    console.log(`====== parse input start =====
${path}
====== input end =====
result =`)

    showAst(r)

    console.log('\n--end--\n')
}

function testTree() {
    let tree = new PathTree()
    let n = 1

    function addPath(path: string) {
        logJson('add path: ', path)
        tree.add(path, 'data' + n++)
    }

    addPath(':b(a-([0-9]+)-(am|pm)-:x(a|b))')
    // addPath('/:a/:b(a-([0-9]+)-:x(a|b))/:c')
    // addPath('/a/b/:c')
    // addPath(':p0?/:a?([0-9]+)/:b-:c/(a-([0-9]+)?)/:d')

    logJson('tree', (tree as any))
}

// testTree()
// testParser()

function logJson(name: string, obj: any) {
    console.log(name + ' = ', JSON.stringify(obj, null, 4))
}

function indent(level: number): string {
    let ret = ''
    for (let i = level; i > 0; --i)
        ret += '    '
    return ret
}

function showAst(node: PathAstNode | undefined | null, level: number = 0) {
    if (!node)
        return

    console.log(`${indent(level)}- ${node.rule && node.rule.name}: ${node.rule && node.rule.type} (${node.input.substring(node.start, node.end)})[${node.start},${node.end}] rules=${node.rule && node.rule.rules} [${node.children && node.children.length}]`)
    if (node.children) {
        for (const c of node.children) {
            showAst(c, level + 1)
        }
    }
}
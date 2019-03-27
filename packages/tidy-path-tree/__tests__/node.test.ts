import * as test from 'tape'
import { PathNode } from '../src/node'
import { createParser } from '../src/grammar'
import { SimpleCache } from '../src'

test('node', t => {
    let root = new PathNode('')
    const path = 'a/**'
    const ast = createParser('/')(path)!
    root.add({
        layers: ast.children,
        path,
        data: 'data',
        regexCache: new SimpleCache(),
        groupIndex: -1000
    }, 0)

    console.log(root._statics)

    t.end()
})
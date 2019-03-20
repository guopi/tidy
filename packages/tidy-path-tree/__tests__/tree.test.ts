import { EntryData, PathTree } from '../src'
import * as test from 'tape'

interface TestData extends EntryData {
    t?: string
}

test('find', (t) => {
    let tree = new PathTree<TestData>()
    tree.add({
        path: '/a/b/:c',
        t: 'abc'
    })
    tree.add({
        path: '/x/y/z',
        t: 'xyz'
    })
    tree.add({
        path: '/1/2/:name--:age',
    })
    t.deepEquals(tree.find('/a/b/test1')!.params, {
        c: 'test1'
    })
    t.deepEquals(tree.find('/1/2/tidy--987')!.params, {
        name: 'tidy',
        age: '987',
    })

    t.end()
})
import * as test from 'tape'
import { PathTree } from '../src/tree'

interface TestData {
    t?: string
}

test('find', (t) => {
    let tree = new PathTree<TestData>()
    tree.add('/a/b/:c', {
        t: 'abc'
    })
    tree.add('/x/y/z', {
        t: 'xyz'
    })
    tree.add('/1/2/:name--:age', {})
    tree.add('/test/([a-z]+)/:index([0-9]+)?', { t: 'withOpt' })

    console.log('tree: ', JSON.stringify((tree as any)._root, null, 4))

    t.deepEquals(tree.find('/a/b/test1')!.params, {
        c: 'test1'
    })
    t.deepEquals(tree.find('/1/2/tidy--987')!.params, {
        name: 'tidy',
        age: '987',
    })
    t.deepEquals(tree.find('/test/abc/123')!.params, {
        index: '123',
    })

    t.deepEquals(tree.find('/test/abc/'), {
        params: {
            index: undefined,
        },
        data: { t: 'withOpt' }
    })

    t.end()
})
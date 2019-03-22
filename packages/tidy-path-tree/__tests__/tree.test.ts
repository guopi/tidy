import * as test from 'tape'
import { PathTree } from '../src/tree'

test('PathTree', (t) => {
    let tree = new PathTree<string | undefined>()
    const addPath = (path: string) => tree.add(path, path)

    addPath('/test/([a-z]+)/:index([0-9]+)?')
    addPath('/a/b/:c')
    addPath('/x/y/z')
    addPath('/1/2/:name--:age')

    // console.log('tree: ', JSON.stringify((tree as any)._root, null, 4))

    function testFind(path: string, params: {} | undefined) {
        const found = tree.find(path)
        if (found === undefined) {
            t.equal(params, undefined, `tree.find( "${path}" ) === undefined`)
            return
        }

        if (!params) params = {}

        const msg = `tree.find( "${path}" ) => params: ${JSON.stringify(params)}`
        t.deepEquals(found && found.params || {}, params, msg)
    }

    testFind('/test/abc', undefined)
    testFind('/test/abc/', {})

    testFind('/a/b/test1', {
        c: 'test1'
    })

    testFind('/1/2/tidy--987', {
        name: 'tidy',
        age: '987',
    })

    testFind('/test/abc/123', {
        index: '123',
    })

    t.end()
})
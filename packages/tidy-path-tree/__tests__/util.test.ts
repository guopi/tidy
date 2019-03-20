import * as test from 'tape'
import { trim } from '../src/util'

test('trim', (t) => {
    t.isEqual(trim('', '/'), '')
    t.isEqual(trim('/', '/'), '')
    t.isEqual(trim('//', '/'), '')
    t.isEqual(trim('///', '/'), '')
    t.isEqual(trim('////', '/'), '')
    t.isEqual(trim('//a//', '/'), 'a')
    t.isEqual(trim('//ab//', '/'), 'ab')
    t.isEqual(trim('//abc//', '/'), 'abc')
    t.isEqual(trim('/abc/', '/'), 'abc')
    t.isEqual(trim('/abc', '/'), 'abc')
    t.isEqual(trim('abc/', '/'), 'abc')
    t.isEqual(trim('abc//', '/'), 'abc')
    t.isEqual(trim('abc', '/'), 'abc')
    t.isEqual(trim('ab', '/'), 'ab')
    t.isEqual(trim('a', '/'), 'a')

    t.end()
})
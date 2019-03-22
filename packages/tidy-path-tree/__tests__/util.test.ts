import * as test from 'tape'
import { trim } from '../src/util'

test('trim', (t) => {
    function testTrim(text: string, expected: string) {
        t.isEqual(trim(text, '/'), expected, `trim( "${text}" ) === "${expected}"`)
    }

    testTrim('', '')
    testTrim('/', '')
    testTrim('//', '')
    testTrim('///', '')
    testTrim('////', '')
    testTrim('//a//', 'a')
    testTrim('//ab//', 'ab')
    testTrim('//abc//', 'abc')
    testTrim('/abc/', 'abc')
    testTrim('/abc', 'abc')
    testTrim('abc/', 'abc')
    testTrim('abc//', 'abc')
    testTrim('abc', 'abc')
    testTrim('ab', 'ab')
    testTrim('a', 'a')

    t.end()
})
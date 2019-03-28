import * as test from 'tape'
import { createParser, escapeTextToRegexStr, TEXT_CHARS_NEED_ESCAPE } from '../src/grammar'
import { nodeText } from '../src/node'

interface ParseExceptLayer {
    raw?: string
    children?: string[]
}

test('parse', t => {
    const parser = createParser('/')

    function testParser(path: string, except: ParseExceptLayer[]) {
        const root = parser(path)
        t.assert(root && root.children)
        t.equal(root!.children!.length, except.length)
        for (let i = 0; i < except.length; i++) {
            let layer = except[i]
            let layerAst = root!.children![i]
            if (layer.children) {
                t.assert(layerAst && layerAst.children)
                t.equal(layerAst.children.length, layer.children.length)
                for (let j = 0, n = layer.children.length; j < n; j++) {
                    t.equal(nodeText(layerAst.children[j]), layer.children[j])
                }
            } else {
                t.equal(nodeText(layerAst), layer.raw)

                if (layerAst.children && layerAst.children.length > 0) {
                    t.equal(layerAst.children.length, 1)
                    t.equal(nodeText(layerAst.children[0]), layer.raw)
                }
            }
        }
    }

    testParser('', [{ raw: '' }])
    testParser('/', [{ raw: '' }, { raw: '' }])
    testParser('a/', [{ raw: 'a' }, { raw: '' }])
    testParser('/b', [{ raw: '' }, { raw: 'b' }])
    testParser('a/b/c', [{ raw: 'a' }, { raw: 'b' }, { raw: 'c' }])
    testParser('a/b/c/**', [{ raw: 'a' }, { raw: 'b' }, { raw: 'c' }, { raw: '**' },])
    testParser('a/:b', [{ raw: 'a' }, {
        children: [':b']
    }])

    t.end()
})

test('escapeTextToRegexStr', (t) => {
    const checked: { [text: string]: true } = {}

    function testEscape(text: string, expected: string) {
        if (checked[text])
            return
        checked[text] = true

        const msg = `escapeTextToRegexStr( "${text}" ) === "${expected}"`
        t.isEqual(escapeTextToRegexStr(text), expected, msg)
    }

    const staticSamples = ['', 'a', 'ab']
    for (const t0 of staticSamples) {
        testEscape(t0, t0)
    }

    for (let i = 0, n = TEXT_CHARS_NEED_ESCAPE.length; i < n; i++) {
        const ch = TEXT_CHARS_NEED_ESCAPE[i]
        const otherCh = TEXT_CHARS_NEED_ESCAPE[n - 1 - i]

        for (const t0 of staticSamples) {
            for (const tEnd of staticSamples) {
                testEscape(t0 + ch + tEnd, `${t0}\\${ch}${tEnd}`)

                for (const tMid of staticSamples) {
                    testEscape(t0 + ch + tMid + otherCh + tEnd, `${t0}\\${ch}${tMid}\\${otherCh}${tEnd}`)
                }
            }
        }
    }

    t.end()
})


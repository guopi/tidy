import * as test from 'tape'
import { escapeTextToRegexStr, TEXT_CHARS_NEED_ESCAPE } from '../src/grammar'

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
import { ParseError } from './error'

const reIgnoredRef = /\((\?\!|\?\:|\?\=)/g
const DEFAULT_CAPTURE_PATTERN = '\\w+'

interface Token {
    type?: 'pattern'
    name?: string
    retain: number
    value: string
    optional?: boolean
}

export class Segment {
    pattern?: boolean
    raw?: string
    tokens: (Token | string)[] = []

    addToken(tk: Token) {
        this.tokens.push(tk)
        this.pattern = true
    }

    addText(text: string) {
        this.tokens.push(text)
    }
}

export class Lexer {
    private _index: number = 0
    private readonly _delimiter: string
    private _params: {
        [param: string]: 1
    } = {}

    constructor(private _input: string, delimiter?: string) {
        this._delimiter = delimiter || '/'
    }

    parse(): Segment[] {
        const input = this._input
        const delimiter = this._delimiter
        const length = input.length

        let currentSeg = new Segment()
        const ret: Segment[] = [currentSeg]

        if (input[0] === delimiter)
            this._index = 1

        let preSlashIndex = this._index
        let char: string
        while ((char = input[this._index]) && this._index < length) {
            switch (char) {
                case ':':
                    currentSeg.addToken(this._scanParam())
                    break
                case '(':
                    currentSeg.addToken(this._scanCapture())
                    break
                case delimiter:
                    if (currentSeg.pattern) {
                        currentSeg.raw = input.substring(preSlashIndex, this._index)
                    }
                    this._index++
                    currentSeg = new Segment()
                    ret.push(currentSeg)
                    preSlashIndex = this._index
                    break
                default:
                    currentSeg.addText(this._readOther())
            }
        }

        if (currentSeg.pattern) {
            currentSeg.raw = input.substring(preSlashIndex, this._index)
        }
        return ret
    }

    private _readOther(): string {
        const input = this._input
        const start = this._index
        let pos = start

        let char = input[pos]
        while (char !== '(' && char !== ':' && char !== this._delimiter) {
            if (char === '?' || char === '+' || char === '*') {
                throw new ParseError('unsupported token ' + char)
            }
            char = input[++pos]
        }

        if (pos <= start)
            throw new ParseError('_readOther failed')

        this._index = pos
        return input.substring(start, pos)
    }

    private _scanParam(): Token {
        this._index++
        const paramName = this._scanWord()

        if (this._params[paramName])
            throw new ParseError(`Conflict param: ${paramName}`)

        this._params[paramName] = 1

        let capture: Token
        if (this._char() === '(') {
            capture = this._scanCapture()
        } else {
            capture = {
                value: DEFAULT_CAPTURE_PATTERN,
                retain: 1
            }
            if (this._eat('?')) {
                capture.optional = true
            }
        }

        capture.name = paramName
        return capture
    }

    private _char() {
        return this._input[this._index]
    }

    private _scanWord(): string {
        const start = this._index
        let pos = start
        const input = this._input

        while (_isAlpha(input[pos])) {
            pos++
        }

        if (pos <= this._index)
            throw Error('readAlpha failed')

        this._index = pos
        return input.substring(start, pos)
    }

    private _scanCapture(): Token {
        this._match('(')

        const input = this._input
        let subCaptureOpen = 0
        let subCapture = 0
        let pos = this._index
        let char: string
        while (char = input[pos]) {
            if (input[pos - 1] !== '\\') {
                if (char === '(') {
                    subCaptureOpen++
                } else if (char === ')') {
                    if (subCaptureOpen > 0) {
                        subCaptureOpen--
                        subCapture++
                    } else {
                        break
                    }
                }
            }
            pos++
        }

        const value = this._input.substring(this._index, pos)

        let ignored = 0
        if (subCapture) {
            let ignoredRet = value.match(reIgnoredRef)
            if (ignoredRet)
                ignored = ignoredRet.length
        }

        const token: Token = {
            type: 'pattern',
            retain: subCapture - ignored + 1,
            value
        }
        this._index = pos

        this._match(')')
        if (this._eat('?')) {
            token.optional = true
        }

        return token
    }

    private _match(char: string): void {
        if (this._char() !== char)
            throw new ParseError(`expect ${char} got ${this._char()}`)

        this._index++
    }

    private _eat(char: string): string | undefined {
        if (this._char() === char) {
            this._index++
            return char
        }
        return undefined
    }
}

function _isAlpha(c: string) {
    return (c >= 'a' && c <= 'z') ||
        (c >= 'A' && c <= 'Z') ||
        (c >= '0' && c <= '9') ||
        c === '_'
}


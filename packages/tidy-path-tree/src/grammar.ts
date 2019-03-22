import { Myna as m } from 'myna-parser'

type Char = string

type PathParser = (input: string) => m.AstNode | null | undefined
type GrammarDict = {
    [name: string]: PathParser
}

export function createParser(delimiter: Char): PathParser {
    const grammarName = 'path' + delimiter.charCodeAt(0)
    const found = (m.parsers as GrammarDict)[grammarName]
    if (found)
        return found

    _currentGrammarDelimiter = delimiter
    const grammar = new PathGrammar()
    m.registerGrammar(grammarName, grammar, grammar.Path)
    return (m.parsers as GrammarDict)[grammarName]
}

/**
 * {Char} must set _currentGrammarDelimiter before new PathGrammar()
 */
let _currentGrammarDelimiter = '/'

/**
 * path grammar definition
 *
 * Regular Expression Literals :
 * spec can found in https://www.ecma-international.org/ecma-262/6.0/#sec-literals-regular-expression-literals
 *   RegularExpressionLiteral ::
 *      / RegularExpressionBody / RegularExpressionFlags
 *   RegularExpressionBody ::
 *      RegularExpressionFirstChar RegularExpressionChars
 *   RegularExpressionChars ::
 *      [empty]
 *      RegularExpressionChars RegularExpressionChar
 *   RegularExpressionFirstChar ::
 *       RegularExpressionNonTerminator but not one of * or \ or / or [
 *       RegularExpressionBackslashSequence
 *       RegularExpressionClass
 *   RegularExpressionChar ::
 *       RegularExpressionNonTerminator but not one of \ or / or [
 *       RegularExpressionBackslashSequence
 *       RegularExpressionClass
 *       RegularExpressionBackslashSequence ::
 *       \ RegularExpressionNonTerminator
 *   RegularExpressionNonTerminator ::
 *      SourceCharacter but not LineTerminator
 *   RegularExpressionClass ::
 *      [ RegularExpressionClassChars ]
 *   RegularExpressionClassChars ::
 *       [empty]
 *       RegularExpressionClassChars RegularExpressionClassChar
 *       RegularExpressionClassChar ::
 *       RegularExpressionNonTerminator but not one of ] or \
 *       RegularExpressionBackslashSequence
 *   RegularExpressionFlags ::
 *      [empty]
 *      RegularExpressionFlags IdentifierPart
 */
class PathGrammar {
    Delimiter = _currentGrammarDelimiter

    QuestionMark = '?'
    BracketOpen = '['
    BracketClose = ']'
    ParenthesesOpen = '('
    ParenthesesClose = ')'

    BackslashChar = m.seq('\\', m.notChar('\r\n'))

    Text = m.choice(
        m.notChar(this.Delimiter + '\r\n:(/?\\'),
        this.BackslashChar
    ).oneOrMore.ast

    ReClassChar = m.choice(
        m.notChar(']\\'),
        this.BackslashChar
    )

    ReClass = m.seq(
        this.BracketOpen,
        this.ReClassChar.oneOrMore,
        this.BracketClose
    )

    _ReGroup = m.delay(() => this.ReGroup)

    Param = m.seq(
        ':',
        m.identifier,
        m.opt(this.QuestionMark),
        m.seq(
            this._ReGroup,
            m.opt(this.QuestionMark)
        ).opt
    ).ast

    ReTextFirstChar = m.choice(
        m.notChar('\r\n\\/[():*?'),
        this.BackslashChar,
        this.ReClass
    )

    ReTextChar = m.choice(
        m.notChar('\r\n\\/[():'),
        this.BackslashChar,
        this.ReClass
    )

    ReText = m.seq(
        this.ReTextFirstChar,
        this.ReTextChar.zeroOrMore
    ).ast

    ReBody = m.choice(
        this.ReText,
        this._ReGroup,
        this.Param,
    ).oneOrMore

    ReGroup = m.seq(
        this.ParenthesesOpen,
        this.ReBody,
        this.ParenthesesClose
    ).ast

    Seg = m.choice(
        this.Param,
        this.Text,
        this.ReGroup
    )

    Layer = this.Seg.zeroOrMore.ast

    Path = m.delimited(this.Layer, this.Delimiter)
}

export type PathGrammarType = keyof PathGrammar
export type PathAstNode = m.AstNode
export const DEFAULT_PARAM_PATTERN = '[.\\w]+'     // [.A-Za-z0-9_]+

interface _TextCharsNeedEscape {
    [charCode: number]: true
}

export const TEXT_CHARS_NEED_ESCAPE = '[.+*?=^!:${}()[]|/\\]'

function _createTextNeedEscapeDict(): _TextCharsNeedEscape {
    const dict: { [charCode: number]: true } = {}
    const chars = TEXT_CHARS_NEED_ESCAPE
    const n = chars.length
    for (let i = 0; i < n; i++) {
        dict[chars.charCodeAt(i)] = true
    }
    return dict
}

const _textNeedEscape = _createTextNeedEscapeDict()
export const CHARCODE_BACKSLASH = '\\'.charCodeAt(0)
export const CHARCODE_QUESTIONMARK = '?'.charCodeAt(0)

export function escapeTextToRegexStr(text: string, prefix?: string) {
    let escaped: string | undefined
    const n = text.length
    if (n === 0)
        return text
    let i = 0
    let normalStart = 0
    while (i < n) {
        const code = text.charCodeAt(i)
        if (code && _textNeedEscape[code]) {
            if (escaped === undefined) escaped = ''
            if (normalStart < i)
                escaped += text.substring(normalStart, i)

            escaped += String.fromCharCode(CHARCODE_BACKSLASH, code)
            normalStart = ++i
        } else {
            ++i
        }
    }
    if (escaped !== undefined) {
        if (normalStart < n)
            escaped += text.substring(normalStart, n)
        return escaped
    } else {
        return text
    }
}

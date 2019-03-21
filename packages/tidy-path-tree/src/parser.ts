import { Myna as m } from 'myna-parser'

type Char = string

type PathParser = (input: string) => any
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

    StaticChar = m.choice(
        m.notChar(this.Delimiter + '?:(\\'),
        this.BackslashChar
    )
    StaticText = this.StaticChar.oneOrMore.ast

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

    ReFirstChar = m.choice(
        m.notChar('\r\f*\\/[()?'),
        this.BackslashChar,
        this.ReClass,
        this._ReGroup
    )

    ReChar = m.choice(
        m.notChar('\r\f\\/[()'),
        this.BackslashChar,
        this.ReClass,
        this._ReGroup
    )

    ReBody = m.seq(
        this.ReFirstChar,
        this.ReChar.zeroOrMore
    )

    ReGroup = m.seq(
        this.ParenthesesOpen,
        this.ReBody,
        this.ParenthesesClose
    ).ast

    Param = m.seq(
        ':',
        m.identifier,
        m.opt(this.QuestionMark),
        this.ReGroup.opt
    ).ast

    Layer = m.choice(
        this.Param,
        this.StaticText,
        this.ReGroup
    ).zeroOrMore.ast

    Path = m.seq(
        m.opt(this.Delimiter),
        m.delimited(this.Layer, this.Delimiter)
    )
}

export type PathGrammarType = keyof PathGrammar

export function trim(s: string, ch: string): string {
    const len = s.length
    if (len === 0)
        return s

    let start = 0
    while (start < len) {
        if (s[start] === ch)
            ++start
        else
            break
    }

    let last = len - 1
    while (last > start) {
        if (s[last] === ch)
            --last
        else
            break
    }

    if (last < start)
        return ''

    if (start === 0 && last === len - 1)
        return s
    return s.substring(start, last + 1)
}


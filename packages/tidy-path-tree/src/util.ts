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

export function sameArray<T>(arr1: T[], arr2: T[]): boolean {
    const len = arr1.length
    if (len !== arr2.length)
        return false

    for (let i = 0; i < len; i++) {
        if (arr1[i] !== arr2[i])
            return false
    }
    return true
}
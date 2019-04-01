export function run<R>(block: () => R): R
export function run<R, T>(it: T, block: (it: T) => R): R

export function run<R, T>(arg0: T | (() => R), arg1?: (it: T) => R): R {
    return typeof arg1 === 'function'
        ? arg1(arg0 as T)
        : (arg0 as () => R)()
}

export function also<T>(it: T, block: (it: T) => void): T {
    block(it)
    return it
}

export function alsoIf<T>(condition: boolean, it: T, block: (it: T) => void): T {
    if (condition)
        block(it)
    return it
}

export function takeIf<T>(it: T, predicate: (it: T) => boolean): T | undefined {
    return predicate(it) ? it : undefined
}

export function takeUnless<T>(it: T, predicate: (it: T) => boolean): T | undefined {
    return predicate(it) ? undefined : it
}

export function repeat<T>(times: number, action: (i: number) => void): void {
    for (let i = 0; i < times; i++) {
        action(i)
    }
}

export function identity<T>(x: T): T {
    return x
}

export function runForPromise<R>(block: () => R): Promise<R>
export function runForPromise<R, T>(it: T, block: (it: T) => R): Promise<R>

export function runForPromise<R, T>(arg0: T | (() => R), arg1?: (it: T) => R): Promise<R> {
    return new Promise<R>((resolve, reject) => {
        try {
            resolve(typeof arg1 === 'function'
                ? arg1(arg0 as T)
                : (arg0 as () => R)())
        } catch (e) {
            reject(e)
        }
    })
}

export function runQuietly<R>(block: () => R): R | undefined
export function runQuietly<R, T>(it: T, block: (it: T) => R): R | undefined

export function runQuietly<R, T>(arg0: T | (() => R), arg1?: (it: T) => R): R | undefined {
    try {
        return typeof arg1 === 'function'
            ? arg1(arg0 as T)
            : (arg0 as () => R)()
    } catch (e) {
        //DO NOTHING
    }
}


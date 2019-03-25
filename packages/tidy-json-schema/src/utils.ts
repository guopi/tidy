import { OptMultiValues } from './types'

export function concatMultiValues<T>(v1: OptMultiValues<T>, v2: OptMultiValues<T>): OptMultiValues<T> {
    let ret: OptMultiValues<T>
    if (v1 === undefined)
        ret = v2
    else if (v2 === undefined)
        ret = v1
    else
        ret = Array.isArray(v1)
            ? (Array.isArray(v2)
                    ? [...(v1 as T[]), ...(v2 as T[])]
                    : [...(v1 as T[]), v2 as T]
            ) : (Array.isArray(v2)
                    ? [v1 as T, ...(v2 as T[])]
                    : [v1 as T, v2 as T]
            )

    return compactMultiValues(ret)
}

export function compactMultiValues<T>(values: OptMultiValues<T>): OptMultiValues<T> {
    if (Array.isArray(values)) {
        switch (values.length) {
            case 0:
                return undefined
            case 1:
                return values[0]
        }
    }
    return values
}

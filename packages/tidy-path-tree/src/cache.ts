export type SimpleKey = string | number

export class SimpleCache<K extends SimpleKey, V> {
    private _keys: K[] = []
    private _map: any = {}
    private readonly _limit: number

    constructor(limit?: number) {
        this._limit = limit || 512
    }

    set(key: K, value: V): V {
        const keys = this._keys

        const map = this._map
        if (keys.length > this._limit) {
            delete this._map[keys.shift()!]
        }

        if (this._map[key] === undefined) {
            keys.push(key)
        }

        map[key] = value
        return value
    }

    get(key: K): V | undefined {
        return this._map[key]
    }

    clear() {
        this._keys = []
        this._map = {}
    }
}
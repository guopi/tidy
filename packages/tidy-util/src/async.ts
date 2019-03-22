type AsyncCallback1<R> = (err: any, data: R) => void

export function asyncOf<R = undefined>(block: (cb: AsyncCallback1<R>) => void): Promise<R> {
    return new Promise<R>((resolve, reject) => {
        block((err: any, data: R) => {
            if (err)
                reject(err)
            else
                resolve(data)
        })
    })
}

type AsyncCallbackMulti<DATA extends any[]> = (err: any, ...data: DATA) => void
type AsyncCallback2<D1, D2> = (err: any, data1: D1, data2: D2) => void
type AsyncCallback3<D1, D2, D3> = (err: any, data1: D1, data2: D2, data3: D3) => void
type AsyncCallback4<D1, D2, D3, D4> = (err: any, data1: D1, data2: D2, data3: D3, data4: D4) => void

export function asyncOfs<D1, D2>(block: (cb: AsyncCallback2<D1, D2>) => void): Promise<[D1, D2]>
export function asyncOfs<D1, D2, D3>(block: (cb: AsyncCallback3<D1, D2, D3>) => void): Promise<[D1, D2, D3]>
export function asyncOfs<D1, D2, D3, D4>(block: (cb: AsyncCallback4<D1, D2, D3, D4>) => void): Promise<[D1, D2, D3, D4]>

export function asyncOfs<DATA extends any[] = []>(block: (cb: AsyncCallbackMulti<DATA>) => void): Promise<DATA> {
    return new Promise<DATA>((resolve, reject) => {
        block((err: any, ...data: DATA) => {
            if (err)
                reject(err)
            else
                resolve(data)
        })
    })
}

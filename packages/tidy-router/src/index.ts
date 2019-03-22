import { TidyBaseRequestType, TidyProcessor, TidyProcessorLike } from 'tidyjs'
import { PathTree, PathTreeOptions } from 'tidy-path-tree'
import { parse } from 'url'

export class TidyRouter<REQ extends TidyBaseRequestType = TidyBaseRequestType> implements TidyProcessorLike<REQ> {
    private _tree: PathTree<TidyProcessor<REQ>>

    constructor(opts?: PathTreeOptions) {
        this._tree = new PathTree(opts)
    }

    asTidyProcessor(): TidyProcessor<REQ, REQ> {
        return (ctx, next) => {
            const path = parse(ctx.url).pathname || ''
            const found = this._tree.find(path)
            if (found) {
                ctx.req.params = found.params
                return found.data(ctx, next)
            }
            return next(ctx)
        }
    }

    //todo
    on(method: 'GET' | 'POS', path: string, handler: TidyProcessor<REQ>): this {
        this._tree.add(path, handler)
        return this
    }
}
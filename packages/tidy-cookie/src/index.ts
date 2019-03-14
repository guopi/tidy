import cookieParser from 'cookie-parser'
import { _TidyUnderlingApp, _TidyUnderlingRequest, TidyApiInput, TidyApiType, TidyPlugin } from 'tidyjs'

interface TidyApiTypeWithCookies extends TidyApiType {
    cookies?: _TidyCookies
}

export function cookiePlugin(): TidyPlugin {
    return {
        onPlug(app: _TidyUnderlingApp) {
            app.use(cookieParser())
        },
        onFilter(req: _TidyUnderlingRequest, input: TidyApiInput<TidyApiType>) {
            (input as TidyApiTypeWithCookies).cookies = req.cookies
            return undefined
        }
    }
}

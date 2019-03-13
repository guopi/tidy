declare global {
    declare namespace Tidy {
        interface ApiType {
            cookies?: _TidyCookies
        }
    }
}

interface _TidyCookies {
    [k: string]: string | undefined
}
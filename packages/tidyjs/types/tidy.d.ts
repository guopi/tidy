declare global {
    declare namespace Tidy {
        // These open interfaces may be extended in an application-specific manner via declaration merging.
        interface ApiType {
        }
    }
}

type _TidyApiType = Tidy.ApiType

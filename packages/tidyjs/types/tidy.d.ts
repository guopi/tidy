declare global {
    declare namespace Tidy {
        // These open interfaces may be extended in an application-specific manner via declaration merging.
        interface RequestType {
        }
        interface ResponseType {
        }
    }
}

interface _Tidy_RequestType extends Tidy.RequestType {
}
interface _Tidy_ResponseType extends Tidy.ResponseType {
}

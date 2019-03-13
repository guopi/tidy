declare global {
    declare namespace Tidy {
        interface ApiType {
            cookies?: {
                [k: string]: string
            }
        }
    }
}

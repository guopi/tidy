interface ServerAppOptions {
    bodyLimit?: number
    useCookie?: boolean
    upload?: {
        fileSizeLimit?: number
        tempDir: string
    }
}
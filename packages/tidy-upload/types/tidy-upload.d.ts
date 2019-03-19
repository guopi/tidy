declare global {
    declare namespace Tidy {
        interface ApiType {
            files?: _TidyUploadFiles;
        }
    }
}

interface _TidyUploadFile {
    size: number;
    path: string;
    name: string;
    type: string;
    lastModifiedDate?: Date;
    hash?: string;
}

interface _TidyUploadFiles {
    [name: string]: _TidyUploadFile | _TidyUploadFile[] | undefined
}

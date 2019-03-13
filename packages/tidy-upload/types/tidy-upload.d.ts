declare global {
    declare namespace Tidy {
        interface ApiType {
            files?: _TidyUploadFiles;
        }
    }
}

interface _TidyUploadFile {
    name: string;
    encoding: string;
    mimetype: string;
    //todo
}

interface _TidyUploadFiles {
    [name: string]: _TidyUploadFile | _TidyUploadFile[] | undefined
}

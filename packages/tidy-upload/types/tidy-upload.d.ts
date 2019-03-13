declare global {
    declare namespace Tidy {
        interface ApiType {
            files?: tidyUpload.FileArray;
        }
    }
}

declare namespace tidyUpload {
    interface FileArray {
        [name: string]: UploadedFile | UploadedFile[]
    }

    interface UploadedFile {
        name: string;
        encoding: string;
        mimetype: string;
        //todo
    }
}

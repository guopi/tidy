import fileUpload from 'express-fileupload'
import * as express from 'express'
import { _TidyUnderlingApp, TidyApiIn, TidyApiType, TidyPlugin } from 'tidyjs'

export interface UploadOptions {
    tempDir: string;
    fileSizeLimit?: number;
}

export interface TidyUploadFiles extends _TidyUploadFiles {
}

export interface TidyUploadFile extends _TidyUploadFile {
}

interface TidyApiTypeWithFiles extends TidyApiType {
    files?: TidyUploadFiles
}

export function uploadPlugin(options: UploadOptions): TidyPlugin {
    return {
        create(app: _TidyUnderlingApp) {
            const opt: fileUpload.Options = {
                useTempFiles: true,
                tempFileDir: options.tempDir
            }
            if (options.fileSizeLimit) {
                opt.limits = {
                    fileSize: options.fileSizeLimit
                }
            }
            (app as any as express.Express).use(fileUpload(opt))
        },
        prepare: (req, input: TidyApiIn<TidyApiType>) => {
            (input as TidyApiTypeWithFiles).files = (req as any as express.Request).files

            return input
        }
    }
}

import fileUpload from 'express-fileupload'
import * as express from 'express'
import { _TidyUnderlingApp, TidyApiIn, TidyApiType, TidyPlugin } from 'tidyjs'
import { _TidyUnderlingRequest } from 'tidyjs/src'

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
        onPlug(app: _TidyUnderlingApp) {
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
        onFilter: (req: _TidyUnderlingRequest, input: TidyApiIn<TidyApiType>) => {
            if ((req as any as express.Request).files) {
                (input as TidyApiTypeWithFiles).files = (req as any as express.Request).files
                input.cleanLater(_in => {
                    //todo clean upload files
                })
            }
            return undefined
        }
    }
}

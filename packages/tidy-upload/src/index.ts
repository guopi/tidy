import fileUpload from 'express-fileupload'
import * as express from 'express'
import { _TidyUnderlingApp, TidyPlugin } from 'tidyjs'

export interface UploadOptions {
    tempDir: string;
    fileSizeLimit?: number;
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
        prepare: (req, input) => {
            input.files = (req as any as express.Request).files
            return input
        }
    }
}

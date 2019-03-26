import {
    NamedDict,
    TidyBaseRequestType,
    TidyNext,
    TidyContext,
    TidyPlugin,
    TidyReturnPromise
} from 'tidyjs'
import http from 'http'
import * as formidable from 'formidable'
import fs from 'fs'

export interface TidyUploadFiles extends _TidyUploadFiles {
}

export type WithFiles<T> = T & {
    files?: TidyUploadFiles
}

export interface UploadOptions {
    onFileBegin?: (name: string, file: formidable.File) => void
}

export function tidyUploadPlugin<REQ extends TidyBaseRequestType = TidyBaseRequestType>(options?: UploadOptions): TidyPlugin<REQ, WithFiles<REQ>> {
    const opts = options || {}
    return async function cookieParser(ctx: TidyContext<REQ>, next: TidyNext<WithFiles<REQ>>): TidyReturnPromise<any> {
        const req = (ctx.req as WithFiles<REQ>)
        let files: TidyUploadFiles | undefined
        if (req.files === undefined && !ctx.disabled(tidyUploadPlugin.DISABLE_KEY)) {
            if (ctx.method.toUpperCase() === 'POST' && ctx.is('multipart/*')) {
                const parsed = await _parseForm(ctx._originReq, opts)
                req.files = files = parsed.files
                req.body = parsed.body
            }
        }

        const deletable = _deletableFilePaths(files)
        if (deletable) {
            try {
                return Promise.resolve(next(ctx as TidyContext<WithFiles<REQ>>))
            } finally {
                _deleteFiles(deletable)
                    .then(errors => {
                        for (const path in errors) {
                            ctx.logger.warn({
                                when: `delete file ${path}`,
                                msg: _errorMessage(errors[path])
                            })
                        }
                    })
                    .catch(err => {
                        ctx.logger.warn({
                            when: `_deleteFiles/catch`,
                            msg: _errorMessage(err)
                        })
                    })
            }
        } else {
            return next(ctx as TidyContext<WithFiles<REQ>>)
        }
    }
}

tidyUploadPlugin.DISABLE_KEY = 'upload'

function _errorMessage(err: any) {
    if (err instanceof Error)
        return err.stack || err.toString()
    if (err)
        return err.text || err.message || err.toString()
    return ''
}

function _deletableFilePaths(files?: TidyUploadFiles): string[] | undefined {
    if (!files)
        return undefined

    const paths: string[] = []
    for (const name in files) {
        const file = files[name]
        if (file) {
            if (Array.isArray(file)) {
                for (const f of file) {
                    if (f.path)
                        paths.push(f.path)
                }
            } else if (file.path) {
                paths.push(file.path)
            }
        }
    }
    return paths.length > 0 ? paths : undefined
}

interface FileErrors {
    [path: string]: any
}

async function _deleteFiles(paths: string[]): Promise<FileErrors> {
    const errors: FileErrors = {}
    return new Promise((resolve, reject) => {
        let n = paths.length
        for (const path of paths) {
            fs.unlink(path, err => {
                n--
                if (err)
                    errors[path] = err
                if (n <= 0)
                    resolve(errors)
            })
        }
    })
}

interface ParsedForm {
    files: TidyUploadFiles
    body: NamedDict
}

async function _parseForm(req: http.IncomingMessage, options: UploadOptions): Promise<ParsedForm> {
    return new Promise(function (resolve, reject) {
        const files: TidyUploadFiles = {}
        const body: NamedDict = {}

        const form = new (formidable.IncomingForm as any)(options as any) as formidable.IncomingForm
        form.on('end', function () {
            return resolve({
                body,
                files
            })
        }).on('error', (err: any) => {
            return reject(err)
        }).on('field', function (name: string, value: string) {
            const current = body[name]
            if (current) {
                if (Array.isArray(current)) {
                    current.push(value)
                } else {
                    body[name] = [current, value]
                }
            } else {
                body[name] = value
            }
        }).on('file', function (name: string, file: formidable.File) {
            let current = files[name]
            if (current) {
                if (Array.isArray(current)) {
                    current.push(file)
                } else {
                    files[name] = [current, file]
                }
            } else {
                files[name] = file
            }
        })
        if (options.onFileBegin) {
            form.on('fileBegin', options.onFileBegin)
        }
        form.parse(req)
    })
}